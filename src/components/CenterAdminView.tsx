import React, { useState } from "react";
import { Teacher, Student, FeeRecord, ExpenseRecord, FeeStructure, Center, CRMLead } from "../types";
import { Users, Landmark, FileSpreadsheet, PlusCircle, CreditCard, ChevronRight, Calculator, PieChart, TrendingUp, TrendingDown, DollarSign, LogOut, RefreshCw, Settings, Sparkles, Receipt, Trash2, Send, MessageSquare, Image } from "lucide-react";
import CrmView from "./CrmView";

interface CenterAdminViewProps {
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
  centers?: Center[];
  leads?: CRMLead[];
  onAddLead?: (lead: Partial<CRMLead>) => void;
  currentUser?: { role: string; email: string; id?: string; name: string; photo?: string } | null;
}

export default function CenterAdminView({
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
}: CenterAdminViewProps) {
  
  // Unified logged-in center resolution
  const loggedInInfo = currentUser || (() => {
    const saved = localStorage.getItem("erp_logged_in_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  })();

  const activeCenterId = loggedInInfo?.id || "C001";
  const activeCenter = (centers || []).find(c => c.id === activeCenterId) || (centers || []).find(c => c.email.toLowerCase() === loggedInInfo?.email?.toLowerCase());
  const activeCenterName = activeCenter?.name || "My Abacus Academy";
  const activeCenterOwner = activeCenter?.ownerName || loggedInInfo?.name || "Center Head";
  const activeCenterEmail = activeCenter?.email || loggedInInfo?.email || "rajesh.east@geniplus.com";

  // Local state synchronization
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // Real-time synchronization whenever props change
  React.useEffect(() => {
    setTeachers(initialTeachers.filter(t => t.centerId === activeCenterId));
    setStudents(initialStudents.filter(s => s.centerId === activeCenterId));
    setFees(initialFees.filter(f => f.centerId === activeCenterId));
    setExpenses(initialExpenses.filter(e => e.centerId === activeCenterId));
  }, [initialTeachers, initialStudents, initialFees, initialExpenses, activeCenterId]);

  // Center Admin Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("centeradmin_is_logged_in") === "true";
  });
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setAdminAuthLoading(true);

    setTimeout(() => {
      const email = adminEmailInput.trim().toLowerCase();
      if (email === "rajesh.east@geniplus.com" && (adminPasswordInput === "password123" || adminPasswordInput === "admin123")) {
        setIsLoggedIn(true);
        localStorage.setItem("centeradmin_is_logged_in", "true");
      } else {
        setAdminAuthError("Incorrect credentials. Please verify your email and password.");
      }
      setAdminAuthLoading(false);
    }, 400);
  };

  const handleAdminLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("centeradmin_is_logged_in");
    setAdminEmailInput("");
    setAdminPasswordInput("");
  };

  // Navigation sub-tabs inside Center Admin
  const [subTab, setSubTab] = useState<"Teachers" | "Students" | "Fees" | "Expenses" | "PnL" | "FeeSetup">("Students");

  // Custom Fee Structure and Custom Invoicing states
  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null);
  const [registrationFeeInput, setRegistrationFeeInput] = useState<number>(1500);
  const [levelFeeInput, setLevelFeeInput] = useState<number>(2500);
  const [examFeeInput, setExamFeeInput] = useState<number>(500);
  const [extraFeesInput, setExtraFeesInput] = useState<any[]>([]);

  // States to add custom extra fee option (competition/activity)
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraAmount, setNewExtraAmount] = useState<number | "">("");

  // States to issue student invoice
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedFeeType, setSelectedFeeType] = useState("Level Fee");
  const [feeMonthInput, setFeeMonthInput] = useState("July 2026");
  const [customInvoiceAmount, setCustomInvoiceAmount] = useState<number>(2500);
  const [studentDiscountInput, setStudentDiscountInput] = useState<number>(0);

  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [structureSaving, setStructureSaving] = useState(false);

  // Load fee structure on mount
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

  React.useEffect(() => {
    loadFeeStructure();
  }, [activeCenterId]);

  // Update customInvoiceAmount automatically when selected fee type changes
  React.useEffect(() => {
    if (selectedFeeType === "Registration") {
      setCustomInvoiceAmount(registrationFeeInput);
    } else if (selectedFeeType === "Level Fee") {
      setCustomInvoiceAmount(levelFeeInput);
    } else if (selectedFeeType === "Exam Fee") {
      setCustomInvoiceAmount(examFeeInput);
    } else {
      const extra = extraFeesInput.find(ex => ex.id === selectedFeeType);
      if (extra) {
        setCustomInvoiceAmount(extra.amount);
      }
    }
  }, [selectedFeeType, registrationFeeInput, levelFeeInput, examFeeInput, extraFeesInput]);

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

  const handleCreateStudentInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert("Please select a student first.");
      return;
    }
    setInvoiceLoading(true);
    try {
      const feeTypeName = selectedFeeType === "Registration" ? "Registration Fee"
                          : selectedFeeType === "Level Fee" ? "Level Fee"
                          : selectedFeeType === "Exam Fee" ? "Exam Fee"
                          : extraFeesInput.find(ex => ex.id === selectedFeeType)?.name || selectedFeeType;

      const payload = {
        studentId: selectedStudent,
        month: feeMonthInput.trim(),
        amount: Number(customInvoiceAmount),
        discount: Number(studentDiscountInput) || 0,
        feeType: feeTypeName,
        centerId: activeCenterId
      };

      const result = await onAddFee(payload);
      if (result) {
        alert(`Invoice issued successfully! Invoice ID: ${result.id}`);
        // Reset discount
        setStudentDiscountInput(0);
      } else {
        alert("Could not raise student fee invoice.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleDeleteFeeInvoice = async (feeId: string) => {
    if (confirm(`Are you sure you want to permanently delete and remove invoice record #${feeId}? This will delete it from all financial ledgers.`)) {
      try {
        await onDeleteFee(feeId);
        alert("Invoice permanently removed.");
      } catch (err: any) {
        alert("Failed to delete: " + err.message);
      }
    }
  };

  // Add Forms
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Form Fields
  const [tName, setTName] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [tMobile, setTMobile] = useState("");
  const [tRole, setTRole] = useState("Teacher");

  const [sName, setSName] = useState("");
  const [sParent, setSParent] = useState("");
  const [sMobile, setSMobile] = useState("");
  const [sAge, setSAge] = useState(8);
  const [sSchool, setSSchool] = useState("");
  const [sLevel, setSLevel] = useState(1);
  const [sBatch, setSBatch] = useState("Sat 10:00 AM");
  const [sTeacherId, setSTeacherId] = useState("T001");

  // Center Payment Configurations States
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [notificationSending, setNotificationSending] = useState<string | null>(null);

  React.useEffect(() => {
    const centerObj = (centers || []).find(c => c.id === activeCenterId);
    if (centerObj) {
      setUpiId(centerObj.upiId || "");
      setBankDetails(centerObj.bankDetails || "");
      setQrCode(centerObj.qrCode || "");
    }
  }, [centers, activeCenterId]);

  const [eCategory, setECategory] = useState<any>("Miscellaneous");
  const [eAmount, setEAmount] = useState<number>(0);
  const [eDesc, setEDesc] = useState("");

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName) return;
    const payload = { centerId: activeCenterId, name: tName, email: tEmail, mobile: tMobile, role: tRole };
    onAddTeacher(payload);

    const newT: Teacher = {
      id: `T00${teachers.length + 10}`,
      centerId: activeCenterId,
      name: tName,
      email: tEmail,
      mobile: tMobile,
      joiningDate: new Date().toISOString().split("T")[0],
      role: tRole,
      status: "Active"
    };
    setTeachers([...teachers, newT]);
    setTName(""); setTEmail(""); setTMobile(""); setShowAddTeacher(false);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName) return;
    const payload = {
      centerId: activeCenterId,
      teacherId: sTeacherId || "T001",
      studentName: sName,
      parentName: sParent,
      parentMobile: sMobile,
      age: sAge,
      school: sSchool,
      currentLevel: sLevel,
      batch: sBatch
    };
    onAddStudent(payload);

    const newS: Student = {
      id: `S00${students.length + 10}`,
      centerId: activeCenterId,
      teacherId: sTeacherId || "T001",
      studentName: sName,
      parentName: sParent,
      parentMobile: sMobile,
      dateOfBirth: "2018-01-01",
      age: sAge,
      school: sSchool,
      currentLevel: sLevel,
      batch: sBatch,
      joiningDate: new Date().toISOString().split("T")[0],
      status: "Active"
    };
    setStudents([...students, newS]);
    setSName(""); setSParent(""); setSMobile(""); setSSchool(""); setShowAddStudent(false);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eAmount) return;
    const payload = { centerId: activeCenterId, category: eCategory, amount: eAmount, date: new Date().toISOString().split("T")[0], description: eDesc };
    onAddExpense(payload);

    const newE: ExpenseRecord = {
      id: `E00${expenses.length + 10}`,
      centerId: activeCenterId,
      category: eCategory,
      amount: eAmount,
      date: new Date().toISOString().split("T")[0],
      description: eDesc
    };
    setExpenses([...expenses, newE]);
    setEAmount(0); setEDesc(""); setShowAddExpense(false);
  };

  const handleMarkFeePaid = (feeId: string) => {
    onPayFee(feeId);
    setFees(prev =>
      prev.map(f => f.id === feeId ? { ...f, status: "Paid", paidDate: new Date().toISOString().split("T")[0] } : f)
    );
  };

  const handleApproveFee = async (feeId: string, action: "Approve" | "Reject", feedback?: string) => {
    try {
      const res = await fetch("/api/erp/approve-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeId, action, feedback })
      });
      const data = await res.json();
      if (data.success) {
        if (action === "Approve") {
          onPayFee(feeId); // trigger parent state refresh
        }
        setFees(prev => prev.map(f => f.id === feeId ? data.fee : f));
        alert(action === "Approve" ? "Payment approved! Receipt issued to student dashboard." : "Payment proof rejected and feedback sent.");
      } else {
        alert("Action failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
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
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, teacherId } : s));
      } else {
        alert("Failed to assign teacher: " + data.error);
      }
    } catch (e) {
      console.error("Failed to assign teacher", e);
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
    } catch (err) {
      console.error(err);
      alert("A network error occurred.");
    }
  };

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

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSaving(true);
    try {
      const res = await fetch("/api/erp/update-payment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: activeCenterId,
          upiId,
          bankDetails,
          qrCode
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Payment settings (UPI, Bank details, QR code) successfully updated and published to student dashboards!");
      } else {
        alert("Failed to save payment settings: " + data.error);
      }
    } catch (err: any) {
      alert("Error saving settings: " + err.message);
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCode(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // P&L Calculations
  const totalRevenues = fees.filter(f => f.status === "Paid").reduce((acc, curr) => acc + (curr.amount - curr.discount), 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutstanding = fees.filter(f => f.status === "Unpaid").reduce((acc, curr) => acc + curr.amount, 0);
  const netEarnings = totalRevenues - totalExpenses;

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-xl text-center space-y-6 animate-fade-in" id="centeradmin-login-card">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-50 border-2 border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm animate-pulse">
            <Calculator className="w-8 h-8" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-indigo-950 font-display">Center Admin Sign In</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Local franchise administrator access. Onboard teachers, audit fee payments, record bills, and track real-time Profit & Loss ledgers.
          </p>
        </div>

        {adminAuthError && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] font-bold text-rose-600">
            {adminAuthError}
          </div>
        )}

        <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Local Admin Email ID</label>
            <input
              type="email"
              required
              placeholder="rajesh.east@geniplus.com"
              value={adminEmailInput}
              onChange={(e) => setAdminEmailInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-indigo-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Secret Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-indigo-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <button
            type="submit"
            disabled={adminAuthLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            {adminAuthLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
            <span>Sign In to Admin Console</span>
          </button>
        </form>

        <div className="border-t border-slate-100 pt-5 text-left text-xs bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="font-bold text-slate-700 mb-1">Testing Credentials:</div>
          <div className="text-[11px] text-slate-500 font-mono flex flex-col gap-1">
            <span>Email: <strong className="text-slate-700">rajesh.east@geniplus.com</strong></span>
            <span>Password: <strong className="text-slate-700">password123</strong></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="center-admin-view">

      {/* Center Admin Welcome & Action Banner */}
      <div className="bg-indigo-950 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="bg-indigo-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest text-indigo-200">
            Authorized Franchise Controller
          </span>
          <h2 className="text-xl md:text-2xl font-black font-display mt-2">
            Welcome back, {activeCenterOwner}! 👋
          </h2>
          <p className="text-xs text-indigo-300 mt-1">
            Center Principal Head • {activeCenterName} Franchise Branch
          </p>
        </div>
        <button
          onClick={handleAdminLogout}
          className="bg-indigo-800 hover:bg-rose-700 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-200 flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Lock Admin Console</span>
        </button>
      </div>
      
      {/* Top statistics widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Active Roster</div>
          <div className="text-2xl md:text-3xl font-black text-indigo-900 mt-1 font-display leading-tight">{students.length} Students</div>
          <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Level 1 to 8 curriculum</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fees Collected (July)</div>
          <div className="text-2xl md:text-3xl font-black text-emerald-600 mt-1 font-display leading-tight">₹{totalRevenues.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Excludes outstanding dues</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Outstanding Dues</div>
          <div className="text-2xl md:text-3xl font-black text-rose-500 mt-1 font-display leading-tight">₹{totalOutstanding.toLocaleString()}</div>
          <div className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Pending parent reminders</span>
          </div>
        </div>

        <div className="bg-amber-400 border-2 border-amber-300 rounded-3xl p-5 shadow-lg shadow-amber-200/40 text-indigo-950">
          <div className="text-[10px] font-black text-indigo-900/80 uppercase tracking-wider">Monthly Profit / Loss</div>
          <div className="text-2xl md:text-3xl font-black mt-1 font-display leading-tight">
            ₹{netEarnings.toLocaleString()}
          </div>
          <div className="text-[10px] text-indigo-900/80 mt-1.5 flex items-center gap-1 font-bold">
            {netEarnings >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-indigo-900" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-900" />}
            <span>Live Center ledger calculations</span>
          </div>
        </div>
      </div>

      {/* Roster & Operations Viewport */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
        
        {/* Navigation Tabs bar */}
        <div className="bg-slate-100/80 p-1.5 rounded-2xl flex flex-wrap gap-1 border-2 border-slate-100/50">
          {[
            { id: "Students", label: "Students Registry", icon: Users },
            { id: "Teachers", label: "Teachers & Staff", icon: Users },
            { id: "Fees", label: "Tuition Fees Ledger", icon: CreditCard },
            { id: "FeeSetup", label: "Fee Settings", icon: Settings },
            { id: "Expenses", label: "Operating Expenses", icon: Landmark },
            { id: "PnL", label: "Interactive Center P&L", icon: Calculator },
            { id: "CRM", label: "AI Marketing & CRM", icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black transition-all rounded-xl outline-none ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-150"
                    : "text-slate-600 hover:text-indigo-900 hover:bg-white/80"
                }`}
                id={`center-subtab-${tab.id}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic viewport contents */}
        <div>
          
          {/* STUDENTS SUB-TAB */}
          {subTab === "Students" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-bold text-gray-900 font-display">Enrolled Students list</div>
                <button
                  onClick={() => setShowAddStudent(!showAddStudent)}
                  className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-indigo-100 active:scale-95"
                  id="toggle-add-student"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Enroll New Student</span>
                </button>
              </div>

              {showAddStudent && (
                <form onSubmit={handleCreateStudent} className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-4">
                  <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">New Student Enrollment Form</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Student Name</label>
                      <input type="text" required value={sName} onChange={(e) => setSName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Parent Name</label>
                      <input type="text" required value={sParent} onChange={(e) => setSParent(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Parent Mobile</label>
                      <input type="text" required value={sMobile} onChange={(e) => setSMobile(e.target.value)} placeholder="+91" className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Age</label>
                      <input type="number" required value={sAge} onChange={(e) => setSAge(Number(e.target.value))} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Curriculum Level</label>
                      <select value={sLevel} onChange={(e) => setSLevel(Number(e.target.value))} className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium">
                        {[1,2,3,4,5,6,7,8].map(l => <option key={l} value={l}>Level {l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Batch Schedule</label>
                      <input type="text" value={sBatch} onChange={(e) => setSBatch(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">School Affiliation</label>
                      <input type="text" value={sSchool} onChange={(e) => setSSchool(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Assign Class Teacher</label>
                      <select value={sTeacherId} onChange={(e) => setSTeacherId(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium">
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddStudent(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">Enroll Student</button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-mono tracking-wider">
                      <th className="p-3">ID</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Parent Details</th>
                      <th className="p-3">Level</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3">Joined</th>
                      <th className="p-3">Assigned Instructor</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-semibold">{s.id}</td>
                        <td className="p-3 font-semibold text-gray-900">{s.studentName}</td>
                        <td className="p-3">
                          <div>{s.parentName}</div>
                          <div className="text-[10px] text-gray-400">{s.parentMobile}</div>
                        </td>
                        <td className="p-3"><span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-lg">Level {s.currentLevel}</span></td>
                        <td className="p-3 font-medium">{s.batch}</td>
                        <td className="p-3 font-mono text-gray-400">{s.joiningDate}</td>
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
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            s.status === "Inactive"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {s.status || "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TEACHERS SUB-TAB */}
          {subTab === "Teachers" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-bold text-gray-900 font-display">Instructors Directory</div>
                <button
                  onClick={() => setShowAddTeacher(!showAddTeacher)}
                  className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-indigo-100 active:scale-95"
                  id="toggle-add-teacher"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Onboard Instructor</span>
                </button>
              </div>

              {showAddTeacher && (
                <form onSubmit={handleCreateTeacher} className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-4">
                  <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">New Teacher Registration</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Full Name</label>
                      <input type="text" required value={tName} onChange={(e) => setTName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Email (Google Account Login)</label>
                      <input type="email" required value={tEmail} onChange={(e) => setTEmail(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Mobile</label>
                      <input type="text" required value={tMobile} onChange={(e) => setTMobile(e.target.value)} placeholder="+91" className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Designated Role</label>
                      <select value={tRole} onChange={(e) => setTRole(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium">
                        <option value="Senior Abacus Trainer">Senior Abacus Trainer</option>
                        <option value="Junior Teacher">Junior Teacher</option>
                        <option value="Head Coach">Head Coach</option>
                        <option value="Marketing & Sales Staff">Marketing & Sales Staff</option>
                        <option value="Teacher & Marketing Representative">Teacher & Marketing Representative</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddTeacher(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">Register Teacher</button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-mono tracking-wider">
                      <th className="p-3">ID</th>
                      <th className="p-3">Teacher Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3">Joined Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teachers.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-semibold">{t.id}</td>
                        <td className="p-3 font-semibold text-gray-900">{t.name}</td>
                        <td className="p-3 font-mono text-indigo-600">{t.email}</td>
                        <td className="p-3 font-medium">{t.mobile}</td>
                        <td className="p-3">
                          <select
                            value={t.role || ""}
                            onChange={(e) => handleAssignTeacherRole(t.id, e.target.value)}
                            className="bg-slate-50 hover:bg-white border border-slate-200 rounded-lg py-1 px-1.5 text-[11px] font-semibold text-slate-800 outline-none"
                          >
                            <option value="Senior Abacus Trainer">Senior Abacus Trainer</option>
                            <option value="Junior Teacher">Junior Teacher</option>
                            <option value="Head Coach">Head Coach</option>
                            <option value="Marketing & Sales Staff">Marketing & Sales Staff</option>
                            <option value="Teacher & Marketing Representative">Teacher & Marketing Representative</option>
                          </select>
                        </td>
                        <td className="p-3 font-mono text-gray-400">{t.joiningDate}</td>
                        <td className="p-3"><span className="text-emerald-700 font-semibold">{t.status}</span></td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(t.id, t.name)}
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition-colors active:scale-95"
                            title="Remove Staff / Instructor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FEES LEDGER SUB-TAB */}
          {subTab === "Fees" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-base font-black text-slate-900 font-display">Student Tuition Fees & Receipt Ledger</h4>
                  <p className="text-xs text-gray-500 mt-1">Review parent UPI/Bank wire transfers, approve payments to issue receipts, or manually log offline cash payments.</p>
                </div>
              </div>

              {/* Bento Grid: 1. Generate Invoice, 2. Student Dues Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Raise New Invoice Form (7 cols) */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <h5 className="text-xs font-black text-indigo-950 uppercase tracking-wider font-display">
                      Generate Custom Student Fee Invoice
                    </h5>
                  </div>
                  <form onSubmit={handleCreateStudentInvoice} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Student</label>
                        <select
                          required
                          value={selectedStudent}
                          onChange={(e) => setSelectedStudent(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="">-- Choose Student --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.studentName} (L{s.currentLevel})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fee Category / Type</label>
                        <select
                          value={selectedFeeType}
                          onChange={(e) => setSelectedFeeType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="Level Fee">Level Tuition Fee (3 Months)</option>
                          <option value="Registration">1st Time Registration Fee</option>
                          <option value="Exam Fee">Exam Fee</option>
                          {extraFeesInput.map(ex => (
                            <option key={ex.id} value={ex.id}>{ex.name} (₹{ex.amount})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Billing Month / Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. July 2026"
                          value={feeMonthInput}
                          onChange={(e) => setFeeMonthInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Base Amount (₹)</label>
                        <input
                          type="number"
                          required
                          value={customInvoiceAmount}
                          onChange={(e) => setCustomInvoiceAmount(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Student Discount (₹)</label>
                        <input
                          type="number"
                          min="0"
                          max={customInvoiceAmount}
                          value={studentDiscountInput}
                          onChange={(e) => setStudentDiscountInput(Number(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Live Invoice Preview Alert */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex justify-between items-center">
                      <div className="text-[11px] text-indigo-950 font-medium">
                        <div>Base Price: <span className="font-bold font-mono">₹{customInvoiceAmount}</span></div>
                        <div>Applied Discount: <span className="font-semibold font-mono text-rose-600">-₹{studentDiscountInput}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-bold text-indigo-500 uppercase">Net Student Invoice Bill</div>
                        <div className="text-lg font-black text-indigo-950 font-mono">
                          ₹{Math.max(0, customInvoiceAmount - studentDiscountInput)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={invoiceLoading}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{invoiceLoading ? "Generating Invoice..." : "Issue & Log Invoice Bill"}</span>
                    </button>
                  </form>
                </div>

                {/* 2. Students Outstanding Dues Panel (5 cols) */}
                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider font-display">
                          Outstanding Student Dues Tracker
                        </h5>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                      Below is the list of active students with outstanding dues. You can track unpaid invoices directly and contact parents for collection.
                    </p>

                    <div className="mt-3 divide-y divide-slate-150 max-h-52 overflow-y-auto pr-1">
                      {students.map(s => {
                        const unpaidInvoices = fees.filter(f => f.studentId === s.id && f.status === "Unpaid");
                        const totalDue = unpaidInvoices.reduce((sum, f) => sum + (f.amount - f.discount), 0);
                        if (totalDue === 0) return null;

                        return (
                          <div key={s.id} className="py-2 flex justify-between items-center text-xs">
                            <div>
                              <div className="font-bold text-slate-900">{s.studentName}</div>
                              <div className="text-[10px] text-slate-400">
                                {unpaidInvoices.length} outstanding bill{unpaidInvoices.length > 1 ? "s" : ""} • L{s.currentLevel}
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="font-black text-rose-600 font-mono">₹{totalDue}</div>
                              <div className="flex items-center gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const parentMobileClean = s.parentMobile.replace(/\s+/g, "").replace(/-/g, "").replace(/\+/g, "");
                                    const messageText = `Dear Parent, this is My Abacus Academy. Please note that Level ${s.currentLevel} tuition fee of ₹${totalDue} is currently due for ${s.studentName}. Kindly make payment via UPI or use your student dashboard to scan the QR code. Thank you!`;
                                    const whatsappUrl = `https://api.whatsapp.com/send?phone=${parentMobileClean}&text=${encodeURIComponent(messageText)}`;
                                    window.open(whatsappUrl, "_blank");
                                  }}
                                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 bg-slate-50 border border-slate-100 rounded-sm py-0.5 px-1"
                                  title="WhatsApp Reminder"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={notificationSending === s.id}
                                  onClick={() => handleSendInAppReminder(s.id, s.studentName, totalDue, s.currentLevel)}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-700 disabled:opacity-50 font-bold flex items-center gap-0.5 bg-slate-50 border border-slate-100 rounded-sm py-0.5 px-1"
                                  title="Send In-App Msg"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>{notificationSending === s.id ? "..." : "In-App"}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {students.every(s => fees.filter(f => f.studentId === s.id && f.status === "Unpaid").length === 0) && (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          🎉 Excellent! No outstanding student dues at this time.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-indigo-950 text-indigo-100 rounded-xl p-3 space-y-1 mt-2 text-center">
                    <div className="text-[10px] font-bold text-indigo-300 uppercase">Total School Dues Receivable</div>
                    <div className="text-xl font-black font-display text-amber-400 font-mono">
                      ₹{fees.filter(f => f.status === "Unpaid").reduce((sum, f) => sum + (f.amount - f.discount), 0).toLocaleString()}
                    </div>
                  </div>
                </div>

              </div>
              
              {/* Parent Payment Verification Board */}
              {fees.filter(f => f.status === "Pending Approval").length > 0 && (
                <div className="bg-amber-50/70 border-2 border-amber-200 rounded-2xl p-5 mb-6 space-y-4 animate-fade-in" id="parent-payment-verification-board">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h5 className="text-xs font-black text-indigo-950 uppercase tracking-wider font-display">
                      Parent Payment Verification Board ({fees.filter(f => f.status === "Pending Approval").length} Pending Review)
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Parents have submitted online transfers along with screenshot receipts. Inspect the transaction details and proof below to issue the permanent receipt to the student portal.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fees.filter(f => f.status === "Pending Approval").map(pFee => {
                      const pStudent = students.find(s => s.id === pFee.studentId);
                      return (
                        <div key={pFee.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-[10px] font-bold text-indigo-600 font-mono uppercase">Invoice {pFee.id}</div>
                              <h6 className="text-sm font-black text-slate-900 mt-0.5">{pStudent ? pStudent.studentName : "Unknown Student"}</h6>
                              <div className="text-[10px] text-slate-400">Billing Month: {pFee.month}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-lg border border-amber-200">
                                Pending Approval
                              </span>
                              <div className="text-sm font-black text-slate-950 mt-1 font-mono">₹{pFee.amount - pFee.discount}</div>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 text-[11px] border border-slate-100">
                            <div>
                              <span className="text-slate-400 font-semibold">Payment Channel:</span> <strong className="text-slate-800">{pFee.paymentMethod}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold">Txn Reference ID:</span> <strong className="text-indigo-950 font-mono">{pFee.referenceNumber}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold">Submission Date:</span> <strong className="text-slate-700 font-mono">{pFee.proofSubmittedDate}</strong>
                            </div>
                          </div>

                          {pFee.proofScreenshot && (
                            <div className="space-y-1">
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Uploaded Image Proof:</div>
                              <div className="relative group overflow-hidden rounded-lg border border-slate-200 max-h-48 bg-slate-100">
                                <img
                                  src={pFee.proofScreenshot}
                                  alt="Receipt Proof"
                                  className="h-32 w-full object-cover group-hover:scale-105 transition-all duration-300"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <a
                                    href={pFee.proofScreenshot}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-white text-[11px] font-extrabold underline bg-indigo-600/80 px-2 py-1 rounded"
                                  >
                                    Open Full Screen Proof
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-1.5">
                            <button
                              onClick={() => handleApproveFee(pFee.id, "Approve")}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg transition-all active:scale-[0.98] shadow-xs"
                            >
                              Approve & Issue Receipt
                            </button>
                            <button
                              onClick={() => {
                                const fb = prompt("Enter a rejection feedback message for the parents (e.g., 'Incomplete payment' or 'Duplicate receipt image'):");
                                if (fb !== null) {
                                  handleApproveFee(pFee.id, "Reject", fb);
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[11px] rounded-lg border border-rose-100 transition-all active:scale-[0.98]"
                            >
                              Reject Proof
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Ledger Receipts and Invoice History */}
              <div className="space-y-2">
                <div className="text-xs font-black text-slate-800 uppercase tracking-wider font-display">School Invoice Records & Ledger</div>
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left text-xs text-gray-600 border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-mono tracking-wider">
                        <th className="p-3">Fee ID</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Category / Title</th>
                        <th className="p-3">Billable Amount</th>
                        <th className="p-3">Discounts</th>
                        <th className="p-3">Net Payment</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Payment Date</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fees.map(f => {
                        const sObj = students.find(s => s.id === f.studentId);
                        return (
                          <tr key={f.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-semibold">{f.id}</td>
                            <td className="p-3 font-bold text-gray-900">{sObj ? sObj.studentName : f.studentId}</td>
                            <td className="p-3 font-medium">
                              <div className="font-semibold text-slate-800">{f.feeType || "Level Tuition Fee"}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{f.month}</div>
                            </td>
                            <td className="p-3 font-mono font-semibold">₹{f.amount}</td>
                            <td className="p-3 font-mono text-rose-500 font-semibold">-₹{f.discount}</td>
                            <td className="p-3 font-mono text-emerald-600 font-bold">₹{f.amount - f.discount}</td>
                            <td className="p-3">
                              {f.status === "Paid" ? (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Paid</span>
                              ) : f.status === "Pending Approval" ? (
                                <div className="flex gap-1.5 items-center font-mono">
                                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 animate-pulse text-[10px]">Pending Review</span>
                                  <button
                                    onClick={() => handleApproveFee(f.id, "Approve")}
                                    className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-black transition-all active:scale-95"
                                    title="Quick Confirm and generate invoice receipt"
                                  >
                                    Approve
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleMarkFeePaid(f.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-lg border border-rose-100 transition-all active:scale-95"
                                  id={`pay-fee-btn-${f.id}`}
                                >
                                  <PlusCircle className="w-3 h-3" />
                                  <span>Mark Paid</span>
                                </button>
                              )}
                            </td>
                            <td className="p-3 font-mono text-gray-400">{f.paidDate || "—"}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteFeeInvoice(f.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete Invoice Entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* FEE STRUCTURE SETUP SUB-TAB */}
          {subTab === "FeeSetup" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="text-base font-black text-slate-900 font-display">Configure Customized School Fees Structure</h4>
                <p className="text-xs text-gray-500 mt-1">Set up custom tuition rates, level-based fees, registration amounts, and add extra-curricular activities or competitions.</p>
              </div>

              <form onSubmit={handleSaveFeeStructure} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Standard Fee Configurations */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Settings className="w-4 h-4 text-indigo-600" />
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
                      Standard Program Rates
                    </h5>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">1st Time Student Registration Fee (₹)</label>
                      <input
                        type="number"
                        required
                        value={registrationFeeInput}
                        onChange={(e) => setRegistrationFeeInput(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">One-time registration fee charged when a student is newly admitted.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Level Tuition Fee (₹)</label>
                      <input
                        type="number"
                        required
                        value={levelFeeInput}
                        onChange={(e) => setLevelFeeInput(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Standard fee for each training level (e.g., Level 1 to 8, usually 3 months).</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Standard Examination Fee (₹)</label>
                      <input
                        type="number"
                        required
                        value={examFeeInput}
                        onChange={(e) => setExamFeeInput(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Charges applied when a student registers to sit for a level completion exam.</span>
                    </div>
                  </div>
                </div>

                {/* Extra-Curricular & Competition Fees */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
                        Competitions & Extra-Curricular Events
                      </h5>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Sometimes your franchise hosts specific Abacus competitions, level championships, or summer camps. Create custom fees below to bill students for these events.
                    </p>

                    {/* Temporary Add Field */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
                      <div className="text-[10px] font-bold text-slate-700 uppercase">Define New Activity Fee Option</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            placeholder="e.g. National Championship 2026"
                            value={newExtraName}
                            onChange={(e) => setNewExtraName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Amount (₹)"
                            value={newExtraAmount}
                            onChange={(e) => setNewExtraAmount(e.target.value !== "" ? Number(e.target.value) : "")}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddExtraFeeItem}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-3 rounded-lg transition-all active:scale-95"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Extra Fees List */}
                    <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
                      {extraFeesInput.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-50/50 border border-slate-150 rounded-xl p-3 text-xs">
                          <div>
                            <span className="font-extrabold text-slate-800">{item.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-mono">ID: {item.id}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-indigo-950 font-mono">₹{item.amount}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveExtraFeeItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {extraFeesInput.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-xs italic">
                          No custom competition or curriculum fee items created yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="submit"
                      disabled={structureSaving}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {structureSaving ? "Saving Rates..." : "Save & Publish Custom Fee Structure"}
                    </button>
                  </div>
                </div>
              </form>

              {/* Center UPI & Bank Payment Options Settings */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
                    My Abacus Academy Payment Settings (Student Dashboard Display)
                  </h5>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Provide your official school bank transfer details, UPI ID, and upload an image of your QR Code. Enrolled students and their parents will instantly see these details inside their parent dashboard to submit tuition payments.
                </p>

                <form onSubmit={handleSavePaymentSettings} className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Official UPI ID (e.g. abacus@upi)</label>
                        <input
                          type="text"
                          required
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="academy@okhdfcbank"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Wire details (Bank Name, Acc No, IFSC Code)</label>
                        <textarea
                          required
                          value={bankDetails}
                          onChange={(e) => setBankDetails(e.target.value)}
                          rows={4}
                          placeholder="Bank: HDFC Bank&#10;Account Holder: My Abacus Academy&#10;Account No: 5010023456789&#10;IFSC Code: HDFC0001234"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">QR Code Payment Graphic Image</label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center transition-colors relative bg-slate-50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrCodeUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {qrCode ? (
                          <div className="space-y-2">
                            <img src={qrCode} alt="Uploaded QR Code" className="h-28 mx-auto object-contain rounded" referrerPolicy="no-referrer" />
                            <div className="text-[10px] text-emerald-600 font-bold">✓ QR code image loaded. Click to replace.</div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 py-4">
                            <Image className="w-8 h-8 text-slate-400 mx-auto" />
                            <div className="text-xs text-slate-600 font-semibold">Drag or browse school payment QR Code image</div>
                            <div className="text-[9px] text-slate-400">Supports PNG, JPG, JPEG (automatically saved)</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={paymentSaving}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {paymentSaving ? "Saving Settings..." : "Publish Payment Settings & QR Code"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EXPENSES SUB-TAB */}
          {subTab === "Expenses" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 font-display">Operational Expenditures</h4>
                  <p className="text-xs text-gray-500">Track building rents, teacher base salaries, utility bills, and campaign expenses.</p>
                </div>
                <button
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-indigo-100 active:scale-95"
                  id="toggle-add-expense"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log Expense</span>
                </button>
              </div>

              {showAddExpense && (
                <form onSubmit={handleCreateExpense} className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-4">
                  <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Log Operational Cost</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Expense Category</label>
                      <select value={eCategory} onChange={(e) => setECategory(e.target.value as any)} className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium">
                        <option value="Rent">Office / Space Rent</option>
                        <option value="Salary">Instructor Base Salary</option>
                        <option value="Marketing">Social Ads & Marketing</option>
                        <option value="Utilities">Broadband & Power Utilities</option>
                        <option value="Miscellaneous">Miscellaneous / Office Supplies</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Amount (₹)</label>
                      <input type="number" required value={eAmount} onChange={(e) => setEAmount(Number(e.target.value))} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Brief Description</label>
                      <input type="text" required value={eDesc} onChange={(e) => setEDesc(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddExpense(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">Log Expense Row</button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-mono tracking-wider">
                      <th className="p-3">ID</th>
                      <th className="p-3">Expense Category</th>
                      <th className="p-3">Amount Charged</th>
                      <th className="p-3">Logged Date</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenses.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-semibold">{e.id}</td>
                        <td className="p-3"><span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-lg text-[10px]">{e.category}</span></td>
                        <td className="p-3 font-mono font-bold text-rose-600">₹{e.amount.toLocaleString()}</td>
                        <td className="p-3 font-mono text-gray-400">{e.date}</td>
                        <td className="p-3 font-medium text-gray-700">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROFIT & LOSS SUB-TAB */}
          {subTab === "PnL" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-900 font-display">July 2026 Profit & Loss Statement (Tenant Ledger)</h4>
                <p className="text-xs text-gray-500">Live reconciliation sheet calculated by subtracting total monthly expenditures from collected school fees.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Visual ledger cards */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-gray-600">Total Tuition Revenues:</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-emerald-600">+₹{totalRevenues.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-xs font-semibold text-gray-600">Total Operating Costs:</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-rose-500">-₹{totalExpenses.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-gray-900 font-display">Net Surplus / Earnings:</span>
                    <span className={`text-base font-extrabold font-mono ${netEarnings >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
                      {netEarnings >= 0 ? "+" : "-"}₹{Math.abs(netEarnings).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Categories breakdown */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <div className="text-xs font-extrabold font-mono text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5" />
                    Expenditure Breakdown
                  </div>
                  <div className="space-y-2">
                    {["Rent", "Salary", "Marketing", "Utilities", "Miscellaneous"].map(cat => {
                      const sum = expenses.filter(e => e.category === cat).reduce((acc, curr) => acc + curr.amount, 0);
                      const pct = totalExpenses > 0 ? (sum / totalExpenses) * 100 : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium text-gray-600">
                            <span>{cat}:</span>
                            <span className="font-mono text-gray-900">₹{sum.toLocaleString()} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* CRM SUB-TAB */}
          {subTab === "CRM" && (
            <div className="space-y-4 animate-fade-in">
              <CrmView leads={leads} onAddLead={onAddLead} />
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
