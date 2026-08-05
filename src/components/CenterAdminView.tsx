import React, { useState, useEffect } from "react";
import { Teacher, Student, FeeRecord, ExpenseRecord, FeeStructure, Center, CRMLead } from "../types";
import { Users, Landmark, FileSpreadsheet, PlusCircle, CreditCard, ChevronRight, Calculator, PieChart, TrendingUp, TrendingDown, DollarSign, LogOut, RefreshCw, Settings, Sparkles, Receipt, Trash2, Send, MessageSquare, Image, BookOpen, Pencil, ShieldAlert, GraduationCap, Package, ShieldCheck, CheckCircle2, RotateCcw, ClipboardList, Search, Database, Clock, ShoppingCart, Plus, Minus, Truck, MapPin, Mail, Phone, History, Bell, BellOff, Award, Filter, X, Check, Calendar, Zap, CheckSquare, Square, CheckCircle } from "lucide-react";
import CrmView from "./CrmView";
import ConceptWorksheetManager from "./ConceptWorksheetManager";
import { AccountingView } from "./AccountingView";
import DigitalCertificateManager from "./DigitalCertificateManager";

export const getCurrentMonthYear = (): string => {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export const getUpcomingBillingMonths = (): string[] => {
  const result: string[] = [];
  const now = new Date();
  for (let i = -2; i <= 11; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    result.push(d.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
  }
  return result;
};

interface CenterAdminViewProps {
  teachers: Teacher[];
  students: Student[];
  fees: FeeRecord[];
  expenses: ExpenseRecord[];
  onAddTeacher: (teacher: Partial<Teacher>) => Promise<any>;
  onAddStudent: (student: Partial<Student> & { billingFrequency?: string }) => Promise<any>;
  onEditStudent?: (student: Partial<Student>) => void;
  onDeleteStudent?: (studentId: string) => void;
  onAddExpense: (expense: Partial<ExpenseRecord>) => void;
  onPayFee: (feeId: string, paidDate?: string, paymentMethod?: string, referenceNumber?: string, billingFrequency?: string) => void;
  onAddFee: (fee: Partial<FeeRecord>) => Promise<any>;
  onDeleteFee: (feeId: string) => Promise<any>;
  onUnpayFee?: (feeId: string) => Promise<any>;
  onUpdateFee?: (payload: { feeId: string; amount?: number; discount?: number; month?: string; status?: string }) => Promise<any>;
  centers?: Center[];
  leads?: CRMLead[];
  onAddLead?: (lead: Partial<CRMLead>) => void;
  currentUser?: { role: string; email: string; id?: string; name: string; photo?: string } | null;
  subTab?: "Teachers" | "Students" | "Fees" | "Expenses" | "PnL" | "FeeSetup" | "NotificationPreferences" | "CRM" | "ConceptWorksheets" | "AOS Subscription" | "Materials" | "ActivityLog" | "Backups" | "TimingApprovals" | "OrderMaterials" | "Certificates" | "MultiCenter";
  onSubTabChange?: (tab: "Teachers" | "Students" | "Fees" | "Expenses" | "PnL" | "FeeSetup" | "NotificationPreferences" | "CRM" | "ConceptWorksheets" | "AOS Subscription" | "Materials" | "ActivityLog" | "Backups" | "TimingApprovals" | "OrderMaterials" | "Certificates" | "MultiCenter") => void;
  onToggleDashboardTab?: (tab: "admin" | "teacher") => void;
  onRefreshData?: () => void;
  studentFeePlans?: any[];
  courses?: any[];
  promotionRequests?: any[];
  materials?: any[];
  activityLogs?: any[];
  practiceSubmissions?: any[];
  homework?: any[];
  timingChangeRequests?: any[];
  materialProducts?: any[];
  materialOrders?: any[];
  shippingSettings?: any;
}

export default function CenterAdminView({
  teachers: initialTeachers,
  students: initialStudents,
  fees: initialFees,
  expenses: initialExpenses,
  onAddTeacher,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onAddExpense,
  onPayFee,
  onAddFee,
  onDeleteFee,
  onUnpayFee,
  onUpdateFee,
  centers = [],
  leads = [],
  onAddLead = () => {},
  currentUser,
  subTab: propSubTab,
  onSubTabChange,
  onToggleDashboardTab,
  onRefreshData,
  studentFeePlans = [],
  courses = [],
  promotionRequests = [],
  materials = [],
  activityLogs = [],
  practiceSubmissions = [],
  homework = [],
  timingChangeRequests = [],
  materialProducts = [],
  materialOrders = [],
  shippingSettings = null
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

  const getCenterId = () => {
    if (loggedInInfo?.centerId) return loggedInInfo.centerId;
    if (loggedInInfo?.id && (loggedInInfo.id.startsWith("T") || loggedInInfo.role === "Manager + Teacher" || loggedInInfo.role === "Teacher")) {
      const teacherObj = (initialTeachers || []).find(t => t.id === loggedInInfo.id || t.email?.toLowerCase() === loggedInInfo.email?.toLowerCase());
      if (teacherObj?.centerId) return teacherObj.centerId;
    }
    return loggedInInfo?.id === "T_M_DEMO" ? (centers[0]?.id || "C001") : loggedInInfo?.id || "C001";
  };
  const activeCenterId = getCenterId();
  const feePlansToUse = (studentFeePlans && studentFeePlans.length > 0) ? studentFeePlans : [
    { id: "plan_std", name: "Standard Plan", monthlyFee: 2000 },
    { id: "plan_prem", name: "Premium Plan", monthlyFee: 3500 },
    { id: "plan_sch", name: "Scholarship Plan", monthlyFee: 500 }
  ];
  const activeCenter = (centers || []).find(c => c.id === activeCenterId) || (centers || []).find(c => c.email.toLowerCase() === loggedInInfo?.email?.toLowerCase());
  
  // Check for any unpaid or overdue SaaS billing invoices for this center
  const [selectedInvoiceToPayId, setSelectedInvoiceToPayId] = React.useState<string>("");
  const [saasInvoices, setSaasInvoices] = React.useState<any[]>([]);
  const unpaidSaaSInvoices = React.useMemo(() => {
    return saasInvoices.filter((inv: any) => inv.centerId === activeCenterId && (inv.status === "Unpaid" || inv.status === "Overdue"));
  }, [saasInvoices, activeCenterId]);
  const invoiceToPay = React.useMemo(() => {
    return unpaidSaaSInvoices.find((inv: any) => inv.id === selectedInvoiceToPayId) || unpaidSaaSInvoices[0];
  }, [unpaidSaaSInvoices, selectedInvoiceToPayId]);
  const activeCenterName = activeCenter?.name || "My Abacus Academy";
  const activeCenterOwner = loggedInInfo?.name || activeCenter?.ownerName || "Center Head";
  const activeCenterEmail = activeCenter?.email || loggedInInfo?.email || "rajesh.east@geniplus.com";

  // Local state synchronization
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [expandedStudentIds, setExpandedStudentIds] = useState<string[]>([]);

  // Teacher Slot Visualizer States
  const [adminSelectedTeacherId, setAdminSelectedTeacherId] = useState<string>("");
  const [adminNewSlotInput, setAdminNewSlotInput] = useState<string>("");

  // Branch Switcher & Multi-Center States
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [showAddBranchModal, setShowAddBranchModal] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<Center | null>(null);

  // Add Branch Form States
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchOwner, setNewBranchOwner] = useState("");
  const [newBranchMobile, setNewBranchMobile] = useState("");
  const [newBranchEmail, setNewBranchEmail] = useState("");
  const [newBranchCity, setNewBranchCity] = useState("");
  const [newBranchState, setNewBranchState] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [newBranchPassword, setNewBranchPassword] = useState("password123");
  const [branchSubmitting, setBranchSubmitting] = useState(false);

  // Edit Branch Form States
  const [editBranchName, setEditBranchName] = useState("");
  const [editBranchOwner, setEditBranchOwner] = useState("");
  const [editBranchMobile, setEditBranchMobile] = useState("");
  const [editBranchEmail, setEditBranchEmail] = useState("");
  const [editBranchCity, setEditBranchCity] = useState("");
  const [editBranchState, setEditBranchState] = useState("");
  const [editBranchPassword, setEditBranchPassword] = useState("");

  // Real-time synchronization whenever props or selectedBranchId change
  React.useEffect(() => {
    if (selectedBranchId === "ALL") {
      setTeachers(initialTeachers);
      setStudents(initialStudents);
      setFees(initialFees);
      setExpenses(initialExpenses);
    } else {
      setTeachers(initialTeachers.filter(t => t.centerId === selectedBranchId));
      setStudents(initialStudents.filter(s => s.centerId === selectedBranchId));
      setFees(initialFees.filter(f => f.centerId === selectedBranchId));
      setExpenses(initialExpenses.filter(e => e.centerId === selectedBranchId));
    }
  }, [initialTeachers, initialStudents, initialFees, initialExpenses, activeCenterId, selectedBranchId]);

  const [localAlsoWorksAsTeacher, setLocalAlsoWorksAsTeacher] = useState<boolean | null>(null);
  const isAlsoWorksAsTeacher = localAlsoWorksAsTeacher !== null ? localAlsoWorksAsTeacher : (activeCenter?.alsoWorksAsTeacher !== false);

  const handleToggleAlsoWorksAsTeacher = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setLocalAlsoWorksAsTeacher(enabled);
    try {
      const res = await fetch("/api/erp/toggle-also-works-as-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId: activeCenterId, enabled })
      });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        setLocalAlsoWorksAsTeacher(!enabled);
        alert(data.error || "Failed to update teacher mode status.");
      }
    } catch (err) {
      console.error("Error toggling works as teacher:", err);
      setLocalAlsoWorksAsTeacher(!enabled);
      alert("Error contacting the server.");
    }
  };

  const logCenterActivity = async (action: string, details: string) => {
    try {
      await fetch("/api/erp/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: loggedInInfo?.name || "Center Admin",
          role: loggedInInfo?.role || "Center Admin",
          action,
          centerId: activeCenterId,
          centerName: activeCenterName,
          details
        })
      });
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error("Failed to log center activity", e);
    }
  };

  // Multi-Center Sub-Center Handlers
  const handleAddSubCenterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) {
      alert("Please enter a Branch Name.");
      return;
    }
    setBranchSubmitting(true);
    try {
      const res = await fetch("/api/erp/add-sub-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentCenterId: activeCenterId,
          name: newBranchName.trim(),
          ownerName: newBranchOwner.trim(),
          mobile: newBranchMobile.trim(),
          email: newBranchEmail.trim(),
          city: newBranchCity.trim(),
          state: newBranchState.trim(),
          address: newBranchAddress.trim(),
          password: newBranchPassword || "password123"
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Sub-Center branch "${data.center.name}" (${data.center.id}) added successfully!`);
        setShowAddBranchModal(false);
        setNewBranchName(""); setNewBranchOwner(""); setNewBranchMobile(""); setNewBranchEmail("");
        setNewBranchCity(""); setNewBranchState(""); setNewBranchAddress(""); setNewBranchPassword("password123");
        if (onRefreshData) onRefreshData();
      } else {
        alert(data.error || "Failed to create sub-center branch.");
      }
    } catch (err: any) {
      alert("Error creating sub-center: " + err.message);
    } finally {
      setBranchSubmitting(false);
    }
  };

  const handleOpenEditSubCenter = (branch: Center) => {
    setEditingBranch(branch);
    setEditBranchName(branch.name);
    setEditBranchOwner(branch.ownerName || "");
    setEditBranchMobile(branch.mobile || "");
    setEditBranchEmail(branch.email || "");
    setEditBranchCity(branch.city || "");
    setEditBranchState(branch.state || "");
    setEditBranchPassword(branch.password || "password123");
  };

  const handleEditSubCenterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    setBranchSubmitting(true);
    try {
      const res = await fetch("/api/erp/edit-sub-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: editingBranch.id,
          parentCenterId: activeCenterId,
          name: editBranchName,
          ownerName: editBranchOwner,
          mobile: editBranchMobile,
          email: editBranchEmail,
          city: editBranchCity,
          state: editBranchState,
          password: editBranchPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Branch "${data.center.name}" updated successfully!`);
        setEditingBranch(null);
        if (onRefreshData) onRefreshData();
      } else {
        alert(data.error || "Failed to edit branch.");
      }
    } catch (err: any) {
      alert("Error updating branch: " + err.message);
    } finally {
      setBranchSubmitting(false);
    }
  };

  const handleDeleteSubCenter = async (branchId: string, branchName: string) => {
    if (!confirm(`Are you sure you want to remove the sub-center branch "${branchName}" (${branchId})? All connected records will be unlinked.`)) {
      return;
    }
    try {
      const res = await fetch("/api/erp/delete-sub-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId: branchId, parentCenterId: activeCenterId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Branch "${branchName}" removed successfully.`);
        if (selectedBranchId === branchId) setSelectedBranchId("ALL");
        if (onRefreshData) onRefreshData();
      } else {
        alert(data.error || "Failed to remove sub-center branch.");
      }
    } catch (err: any) {
      alert("Error deleting branch: " + err.message);
    }
  };

  // Center Admin Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("centeradmin_is_logged_in") === "true";
  });

  const hasCentralAuth = loggedInInfo && (loggedInInfo.role === "Center Admin" || loggedInInfo.role === "Manager + Teacher");
  const isActuallyLoggedIn = isLoggedIn || hasCentralAuth;
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
  const [localSubTab, setLocalSubTab] = useState<"Teachers" | "Students" | "Fees" | "Expenses" | "PnL" | "FeeSetup" | "NotificationPreferences" | "CRM" | "ConceptWorksheets" | "AOS Subscription" | "Materials" | "ActivityLog" | "Backups" | "TimingApprovals" | "OrderMaterials">("Students");
  const subTab = propSubTab || localSubTab;
  const setSubTab = onSubTabChange || setLocalSubTab;

  // System Backups state variables
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupType, setBackupType] = useState<"daily" | "weekly" | "monthly">("daily");

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch("/api/erp/backups");
      const data = await res.json();
      if (data.success) {
        setBackups(data.backups);
      }
    } catch (err) {
      console.error("Error fetching backups:", err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const loadSaaSBankAndInvoices = async () => {
    try {
      const resBank = await fetch("/api/erp/superadmin-payment-details");
      const dataBank = await resBank.json();
      if (dataBank.success && dataBank.details) {
        const d = dataBank.details;
        setSaasHolder(d.holderName);
        setSaasBank(d.bankName);
        setSaasAccount(d.accountNumber);
        setSaasIfsc(d.ifscCode);
        setSaasUpi(d.upiId);
        setSaasNotes(d.paymentNotes);

        localStorage.setItem("superadmin_holder_name", d.holderName);
        localStorage.setItem("superadmin_bank_name", d.bankName);
        localStorage.setItem("superadmin_account_number", d.accountNumber);
        localStorage.setItem("superadmin_ifsc_code", d.ifscCode);
        localStorage.setItem("superadmin_upi_id", d.upiId);
        localStorage.setItem("superadmin_payment_notes", d.paymentNotes);
      }
    } catch (e) {
      console.error("Error loading SaaS bank details in CenterAdmin:", e);
    }

    try {
      const resInvs = await fetch("/api/erp/saas-invoices");
      const dataInvs = await resInvs.json();
      if (dataInvs.success && dataInvs.invoices) {
        setSaasInvoices(dataInvs.invoices);
      }
    } catch (e) {
      console.error("Error loading SaaS invoices in CenterAdmin:", e);
    }
  };

  useEffect(() => {
    if (subTab === "Backups" && currentUser?.role === "Super Admin") {
      fetchBackups();
    }
    if (subTab === "AOS Subscription") {
      loadSaaSBankAndInvoices();
    }
  }, [subTab, currentUser]);

  // Super Admin bank/payment details loaded dynamically for SaaS Billing
  const [saasHolder, setSaasHolder] = useState(() => localStorage.getItem("superadmin_holder_name") || "GENIPLUS KIDS ACADEMY");
  const [saasBank, setSaasBank] = useState(() => localStorage.getItem("superadmin_bank_name") || "AXIS BANK");
  const [saasAccount, setSaasAccount] = useState(() => localStorage.getItem("superadmin_account_number") || "920020055809848");
  const [saasIfsc, setSaasIfsc] = useState(() => localStorage.getItem("superadmin_ifsc_code") || "UTIB0003818");
  const [saasUpi, setSaasUpi] = useState(() => localStorage.getItem("superadmin_upi_id") || "geniplus@axl");
  const [saasNotes, setSaasNotes] = useState(() => localStorage.getItem("superadmin_payment_notes") || "Please mention your Center ID in the transaction description.");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentRefInput, setPaymentRefInput] = useState("");
  const [paymentMethodInput, setPaymentMethodInput] = useState("UPI Transfer");
  const [saasBillPaidSuccess, setSaasBillPaidSuccess] = useState("");

  // Courses state variables
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseDuration, setNewCourseDuration] = useState("3 Months");
  const [newCourseFee, setNewCourseFee] = useState(3600);
  const [newCourseExamFee, setNewCourseExamFee] = useState(300);
  const [newCourseRegFee, setNewCourseRegFee] = useState(500);
  const [courseAdding, setCourseAdding] = useState(false);

  // Level Promotion Approval states
  const [selectedPromoReq, setSelectedPromoReq] = useState<any | null>(null);
  const [promoBillingFreq, setPromoBillingFreq] = useState("Level-wise");
  const [promoTuitionFee, setPromoTuitionFee] = useState(3600);
  const [promoMaterialFee, setPromoMaterialFee] = useState(0);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoSubmitting, setPromoSubmitting] = useState(false);

  // Center Order Materials states
  const [centerCart, setCenterCart] = useState<{ [productId: string]: number }>({});
  const [centerOrderName, setCenterOrderName] = useState("");
  const [centerOrderPhone, setCenterOrderPhone] = useState("");
  const [centerOrderEmail, setCenterOrderEmail] = useState("");
  const [centerOrderAddress, setCenterOrderAddress] = useState("");
  const [centerOrderPaymentRef, setCenterOrderPaymentRef] = useState("");
  const [centerOrderSubmitting, setCenterOrderSubmitting] = useState(false);
  const [centerOrderSuccess, setCenterOrderSuccess] = useState("");
  const [centerOrderError, setCenterOrderError] = useState("");

  useEffect(() => {
    if (activeCenter) {
      setCenterOrderName((activeCenter as any).name || "");
      setCenterOrderPhone((activeCenter as any).phone || "");
      setCenterOrderEmail((activeCenter as any).email || "");
      setCenterOrderAddress((activeCenter as any).address || "");
    }
  }, [activeCenter]);

  const handlePlaceCenterOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const centerCartItems = Object.keys(centerCart).map(id => {
      const p = (materialProducts || []).find((prod: any) => prod.id === id);
      return { product: p, quantity: centerCart[id] };
    }).filter(item => item.product !== undefined);

    if (centerCartItems.length === 0) {
      setCenterOrderError("Your order cart is empty.");
      return;
    }
    if (!centerOrderName.trim() || !centerOrderPhone.trim() || !centerOrderEmail.trim() || !centerOrderAddress.trim()) {
      setCenterOrderError("Please complete all delivery details.");
      return;
    }

    setCenterOrderSubmitting(true);
    setCenterOrderError("");
    setCenterOrderSuccess("");

    let centerSubtotal = centerCartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    let centerTotalWeight = centerCartItems.reduce((acc, item) => acc + ((item.product.weight || 0) * item.quantity), 0);

    let centerShippingCharge = 0;
    if (centerTotalWeight > 0) {
      const sRule = shippingSettings || { baseWeightLimit: 500, baseShippingCharge: 60, additionalWeightStep: 500, additionalShippingCharge: 40 };
      const baseLimit = Number(sRule.baseWeightLimit) || 500;
      const baseCharge = Number(sRule.baseShippingCharge) || 60;
      const stepWeight = Number(sRule.additionalWeightStep) || 500;
      const stepCharge = Number(sRule.additionalShippingCharge) || 40;

      if (centerTotalWeight <= baseLimit) {
        centerShippingCharge = baseCharge;
      } else {
        const extra = centerTotalWeight - baseLimit;
        const steps = Math.ceil(extra / stepWeight);
        centerShippingCharge = baseCharge + (steps * stepCharge);
      }
    }

    const payload = {
      buyerType: "Center",
      buyerId: activeCenterId,
      buyerName: centerOrderName,
      buyerEmail: centerOrderEmail,
      buyerPhone: centerOrderPhone,
      centerId: activeCenterId,
      address: centerOrderAddress,
      paymentMethod: "UPI Transfer",
      paymentRef: centerOrderPaymentRef,
      paymentStatus: "Pending",
      items: centerCartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    try {
      const res = await fetch("/api/erp/inventory/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setCenterOrderSuccess(`Your order #${data.order.id} was placed successfully! Invoice added to billing logs.`);
        setCenterCart({});
        setCenterOrderPaymentRef("");
        if (onRefreshData) onRefreshData();

        // Refresh SaaS invoices so the new invoice shows up immediately in the billing tab
        try {
          const sRes = await fetch("/api/erp/saas-invoices");
          const sData = await sRes.json();
          if (sData.success && sData.invoices) {
            setSaasInvoices(sData.invoices);
          }
        } catch (sErr) {
          console.error("Failed to refresh SaaS invoices after order:", sErr);
        }
      } else {
        setCenterOrderError(data.error || "Failed to submit order.");
      }
    } catch (err) {
      setCenterOrderError("Network error. Please try again.");
    } finally {
      setCenterOrderSubmitting(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    setCourseAdding(true);
    try {
      const res = await fetch("/api/erp/add-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCourseName,
          duration: newCourseDuration,
          fee: newCourseFee,
          examFee: newCourseExamFee,
          registrationFee: newCourseRegFee,
          centerId: activeCenter?.id || "C001"
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewCourseName("");
        if (onRefreshData) onRefreshData();
        alert("New course offering added successfully!");
      } else {
        alert("Failed to add course: " + data.error);
      }
    } catch (err: any) {
      alert("Error adding course: " + err.message);
    } finally {
      setCourseAdding(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to remove this course offering?")) return;
    try {
      const res = await fetch("/api/erp/delete-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId })
      });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) onRefreshData();
        alert("Course offering removed successfully.");
      } else {
        alert("Failed to remove course: " + data.error);
      }
    } catch (err: any) {
      alert("Error removing course: " + err.message);
    }
  };

  // Payment Plans Management States (Centre Admin)
  const [centerPlans, setCenterPlans] = useState<any[]>([]);
  const [planNameInput, setPlanNameInput] = useState("");
  const [planCourseInput, setPlanCourseInput] = useState("Abacus Level 1-8");
  const [planMonthlyPrice, setPlanMonthlyPrice] = useState<number | "">(1500);
  const [planYearlyPrice, setPlanYearlyPrice] = useState<number | "">(14400);
  const [planSavingsTag, setPlanSavingsTag] = useState("Save 20%");
  const [planFeatures, setPlanFeatures] = useState("2 Live Interactive Classes / Week\nFree Physical Abacus Kit & Books\nUnlimited Speed Drills & Worksheets\nLevel Completion Certificates");
  const [planPopular, setPlanPopular] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [planBillingCycle, setPlanBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const loadPaymentPlans = async () => {
    try {
      const res = await fetch("/api/erp/payment-plans");
      const data = await res.json();
      if (data.success) {
        setCenterPlans(data.plans || []);
      }
    } catch (err) {
      console.error("Error loading payment plans:", err);
    }
  };

  useEffect(() => {
    loadPaymentPlans();
  }, []);

  const handleSavePaymentPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planNameInput) return;
    setPlanSaving(true);
    try {
      const featuresArray = planFeatures.split("\n").map(f => f.trim()).filter(Boolean);
      const res = await fetch("/api/erp/payment-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          plan: {
            centerId: activeCenterId || "GLOBAL",
            name: planNameInput,
            course: planCourseInput,
            monthlyPrice: Number(planMonthlyPrice) || 0,
            yearlyPrice: Number(planYearlyPrice) || 0,
            savingsTag: planSavingsTag,
            popular: planPopular,
            features: featuresArray,
            status: "Active"
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setCenterPlans(data.plans);
        setPlanNameInput("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPlanSaving(false);
    }
  };

  const handleDeletePaymentPlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment plan?")) return;
    try {
      const res = await fetch("/api/erp/payment-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", plan: { id } })
      });
      const data = await res.json();
      if (data.success) {
        setCenterPlans(data.plans);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprovePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromoReq) return;
    setPromoSubmitting(true);
    try {
      const res = await fetch("/api/erp/approve-promotion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedPromoReq.id,
          billingFrequency: promoBillingFreq,
          tuitionFee: promoTuitionFee,
          materialFee: promoMaterialFee,
          discountPercent: promoDiscount
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPromoReq(null);
        if (onRefreshData) onRefreshData();
        alert(data.message || "Promotion approved and billed successfully!");
      } else {
        alert("Failed to approve promotion: " + data.error);
      }
    } catch (err: any) {
      alert("Error approving promotion: " + err.message);
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handleRejectPromotion = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to reject this promotion request?")) return;
    try {
      const res = await fetch("/api/erp/reject-promotion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) onRefreshData();
        alert("Promotion request rejected.");
      } else {
        alert("Failed to reject promotion: " + data.error);
      }
    } catch (err: any) {
      alert("Error rejecting promotion: " + err.message);
    }
  };

  // Load Super Admin SaaS banking details and invoices from backend on mount
  React.useEffect(() => {
    loadSaaSBankAndInvoices();
  }, []);

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
  const [feeMonthInput, setFeeMonthInput] = useState(() => getCurrentMonthYear());
  const [customInvoiceAmount, setCustomInvoiceAmount] = useState<number>(2500);
  const [studentDiscountInput, setStudentDiscountInput] = useState<number>(0);

  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [customInvoiceBillingFreq, setCustomInvoiceBillingFreq] = useState<string>("Monthly");
  const [structureSaving, setStructureSaving] = useState(false);

  // Manual Invoice Builder states
  const [invCourseId, setInvCourseId] = useState("c_abacus");
  const [includeTuition, setIncludeTuition] = useState(true);
  const [tuitionAmount, setTuitionAmount] = useState<number>(3600);
  const [tuitionDesc, setTuitionDesc] = useState("Tuition Fee");
  
  const [includeRegistration, setIncludeRegistration] = useState(false);
  const [registrationAmount, setRegistrationAmount] = useState<number>(500);
  const [registrationDesc, setRegistrationDesc] = useState("Registration Fee");
  
  const [includeExam, setIncludeExam] = useState(false);
  const [examAmount, setExamAmount] = useState<number>(300);
  const [examDesc, setExamDesc] = useState("Exam Fee");
  
  const [includeOther, setIncludeOther] = useState(false);
  const [otherAmount, setOtherAmount] = useState<number>(0);
  const [otherDesc, setOtherDesc] = useState("Miscellaneous/Material Fee");
  
  // Convert Level Fee to Monthly toggle
  const [isMonthlyTuition, setIsMonthlyTuition] = useState(false);

  // Activity Log Filter States
  const [logFilterDate, setLogFilterDate] = useState("");
  const [logFilterUser, setLogFilterUser] = useState("");
  const [logFilterAction, setLogFilterAction] = useState("");

  const populateCourseFees = (courseId: string, monthlyMode: boolean = false) => {
    const currentCourse = courses.find(c => c.id === courseId) || [
      { id: "c_abacus", name: "Abacus", duration: "3 Months", fee: 3600, examFee: 300, registrationFee: 500 },
      { id: "c_rubik", name: "Rubik's Cube", duration: "1 Month", fee: 1500, examFee: 200, registrationFee: 200 },
      { id: "c_vedic", name: "Vedic Maths", duration: "3 Months", fee: 3600, examFee: 300, registrationFee: 500 },
      { id: "c_chess", name: "Chess", duration: "3 Months", fee: 3000, examFee: 250, registrationFee: 300 },
      { id: "c_coding", name: "Coding", duration: "3 Months", fee: 6000, examFee: 500, registrationFee: 500 }
    ].find(d => d.id === courseId);
    
    if (currentCourse) {
      const fullFee = Number(currentCourse.fee) || 3600;
      setTuitionAmount(monthlyMode ? Math.round(fullFee / 3) : fullFee);
      setTuitionDesc(`${currentCourse.name} Tuition Fee`);
      setRegistrationAmount(Number(currentCourse.registrationFee) || 500);
      setRegistrationDesc(`${currentCourse.name} Registration/Admission Fee`);
      setExamAmount(Number(currentCourse.examFee) || 300);
      setExamDesc(`${currentCourse.name} Exam Fee`);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
    setIsMonthlyTuition(false);
    if (studentId) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        const studentCourseId = student.courseId || "c_abacus";
        setInvCourseId(studentCourseId);
        
        const alreadyRegistered = fees.some(f => 
          f.studentId === student.id && 
          (f.feeType?.toLowerCase().includes("registration") || f.description?.toLowerCase().includes("registration"))
        );
        setIncludeRegistration(!alreadyRegistered);
        
        populateCourseFees(studentCourseId, false);

        // Remember last charged fee for this student!
        const studentFees = fees.filter(f => f.studentId === student.id);
        if (studentFees.length > 0) {
          const lastFee = [...studentFees].sort((a, b) => {
            const dateA = a.createdAt || a.issueDate || a.dueDate || "";
            const dateB = b.createdAt || b.issueDate || b.dueDate || "";
            return dateB.localeCompare(dateA);
          })[0];

          if (lastFee) {
            const prevAmount = Number(lastFee.amount) || 0;
            if (prevAmount > 0) {
              setTuitionAmount(prevAmount);
            }
            if (lastFee.discount !== undefined) {
              setStudentDiscountInput(Number(lastFee.discount) || 0);
            }
          }
        }
      }
    }
  };

  const handleInvoiceCourseChange = (courseId: string) => {
    setInvCourseId(courseId);
    setIsMonthlyTuition(false);
    populateCourseFees(courseId, false);
  };

  const getSelectedInvoiceTotal = () => {
    let total = 0;
    if (includeTuition) total += Number(tuitionAmount) || 0;
    if (includeRegistration) total += Number(registrationAmount) || 0;
    if (includeExam) total += Number(examAmount) || 0;
    if (includeOther) total += Number(otherAmount) || 0;
    return total;
  };

  const getSelectedStudentCourseInfo = () => {
    if (!selectedStudent) return null;
    const student = students.find(s => s.id === selectedStudent);
    if (!student) return null;

    const cId = student.courseId || "c_abacus";
    const course = courses.find(c => c.id === cId) || [
      { id: "c_abacus", name: "Abacus", duration: "3 Months", fee: 3600, examFee: 300, registrationFee: 500 },
      { id: "c_rubik", name: "Rubik's Cube", duration: "1 Month", fee: 1500, examFee: 200, registrationFee: 200 },
      { id: "c_vedic", name: "Vedic Maths", duration: "3 Months", fee: 3600, examFee: 300, registrationFee: 500 },
      { id: "c_chess", name: "Chess", duration: "3 Months", fee: 3000, examFee: 250, registrationFee: 300 },
      { id: "c_coding", name: "Coding", duration: "3 Months", fee: 6000, examFee: 500, registrationFee: 500 }
    ].find(d => d.id === cId);

    if (!course) return null;

    const alreadyRegistered = fees.some(f => f.studentId === student.id && (f.feeType?.toLowerCase().includes("registration") || f.description?.toLowerCase().includes("registration")));

    const durationMatch = (course.duration || "3 Months").match(/\d+/);
    const durationMonths = durationMatch ? parseInt(durationMatch[0]) : 3;
    const levelFee = Number(course.fee) || 3600;
    const monthlyFee = durationMonths > 0 ? Math.round(levelFee / durationMonths) : levelFee;

    return {
      student,
      course,
      durationMonths,
      levelFee,
      monthlyFee,
      registrationFee: Number(course.registrationFee) || 500,
      examFee: Number(course.examFee) || 300,
      alreadyRegistered
    };
  };

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

  const get1stOfMonthDate = (monthStr: string): string => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    let mIdx = -1;
    let yr = new Date().getFullYear();
    
    const words = monthStr.split(/\s+/);
    for (const w of words) {
      const clean = w.replace(/[^a-zA-Z]/g, "").trim();
      if (clean.length >= 3) {
        const idx = months.findIndex(m => m.toLowerCase().startsWith(clean.toLowerCase()));
        if (idx !== -1) mIdx = idx;
      }
      const num = parseInt(w.replace(/[^0-9]/g, ""));
      if (num >= 2020 && num <= 2100) yr = num;
    }
    if (mIdx === -1) mIdx = new Date().getMonth();
    const mPad = String(mIdx + 1).padStart(2, "0");
    return `${yr}-${mPad}-01`;
  };

  const getIncrementedMonth = (baseMonthStr: string, increment: number): string => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    let foundMonthIndex = -1;
    let year = new Date().getFullYear();
    
    const words = baseMonthStr.split(/\s+/);
    for (const word of words) {
      const clean = word.replace(/[^a-zA-Z]/g, "").trim();
      if (clean.length >= 3) {
        const idx = months.findIndex(m => m.toLowerCase().startsWith(clean.toLowerCase()));
        if (idx !== -1) {
          foundMonthIndex = idx;
        }
      }
      const num = parseInt(word.replace(/[^0-9]/g, ""));
      if (num >= 2020 && num <= 2100) {
        year = num;
      }
    }
    
    if (foundMonthIndex === -1) {
      const parsedDate = new Date(baseMonthStr);
      if (!isNaN(parsedDate.getTime())) {
        foundMonthIndex = parsedDate.getMonth();
        year = parsedDate.getFullYear();
      } else {
        foundMonthIndex = new Date().getMonth();
      }
    }
    
    const totalMonths = foundMonthIndex + increment;
    const newMonthIndex = ((totalMonths % 12) + 12) % 12;
    const yearOffset = Math.floor(totalMonths / 12);
    const newYear = year + yearOffset;
    
    return `${months[newMonthIndex]} ${newYear}`;
  };

  const handleCreateStudentInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert("Please select a student first.");
      return;
    }

    const baseTotal = getSelectedInvoiceTotal();
    if (baseTotal <= 0) {
      alert("Please select at least one fee item to charge and specify a valid amount.");
      return;
    }

    setInvoiceLoading(true);
    try {
      if (isMonthlyTuition && includeTuition) {
        // Multi-month billing flow: Create 3 monthly installment invoices
        const month1 = feeMonthInput.trim();
        const dueDate1 = get1stOfMonthDate(month1);
        
        // Month 1: tuition installment 1/3 + other selected one-time fees (Registration, Exam, Other)
        const parts1 = [`${tuitionDesc} (Installment 1/3 - ₹${tuitionAmount})`];
        if (includeRegistration) parts1.push(`${registrationDesc} (₹${registrationAmount})`);
        if (includeExam) parts1.push(`${examDesc} (₹${examAmount})`);
        if (includeOther) parts1.push(`${otherDesc} (₹${otherAmount})`);
        const feeTypeName1 = parts1.join(" + ");
        
        const amount1 = Number(tuitionAmount) +
                        (includeRegistration ? Number(registrationAmount) : 0) +
                        (includeExam ? Number(examAmount) : 0) +
                        (includeOther ? Number(otherAmount) : 0);

        const payload1 = {
          studentId: selectedStudent,
          month: month1,
          dueDate: dueDate1,
          amount: amount1,
          discount: Number(studentDiscountInput) || 0,
          feeType: feeTypeName1,
          centerId: activeCenterId,
          billingFrequency: customInvoiceBillingFreq
        };
        
        const result1 = await onAddFee(payload1);
        if (!result1) throw new Error("Could not create the 1st installment invoice.");

        // Month 2: tuition installment 2/3 only
        const month2 = getIncrementedMonth(month1, 1);
        const dueDate2 = get1stOfMonthDate(month2);
        const feeTypeName2 = `${tuitionDesc} (Installment 2/3 - ₹${tuitionAmount})`;
        const payload2 = {
          studentId: selectedStudent,
          month: month2,
          dueDate: dueDate2,
          amount: Number(tuitionAmount),
          discount: 0,
          feeType: feeTypeName2,
          centerId: activeCenterId,
          billingFrequency: customInvoiceBillingFreq
        };
        const result2 = await onAddFee(payload2);
        if (!result2) throw new Error("Could not create the 2nd installment invoice.");

        // Month 3: tuition installment 3/3 only
        const month3 = getIncrementedMonth(month1, 2);
        const dueDate3 = get1stOfMonthDate(month3);
        const feeTypeName3 = `${tuitionDesc} (Installment 3/3 - ₹${tuitionAmount})`;
        const payload3 = {
          studentId: selectedStudent,
          month: month3,
          dueDate: dueDate3,
          amount: Number(tuitionAmount),
          discount: 0,
          feeType: feeTypeName3,
          centerId: activeCenterId,
          billingFrequency: customInvoiceBillingFreq
        };
        const result3 = await onAddFee(payload3);
        if (!result3) throw new Error("Could not create the 3rd installment invoice.");

        alert(`Success! Generated 3 monthly installment invoices starting from ${month1}:
• 1st Invoice: ${month1} (Due ${dueDate1})
• 2nd Invoice: ${month2} (Due ${dueDate2})
• 3rd Invoice: ${month3} (Due ${dueDate3})`);
        
        // Reset states
        setStudentDiscountInput(0);
        setIsMonthlyTuition(false);
        setIncludeOther(false);
        setOtherAmount(0);
        setOtherDesc("Miscellaneous/Material Fee");
        setFeeMonthInput(getCurrentMonthYear());
      } else {
        // Standard single invoice flow
        const parts = [];
        if (includeTuition) parts.push(`${tuitionDesc} (₹${tuitionAmount})`);
        if (includeRegistration) parts.push(`${registrationDesc} (₹${registrationAmount})`);
        if (includeExam) parts.push(`${examDesc} (₹${examAmount})`);
        if (includeOther) parts.push(`${otherDesc} (₹${otherAmount})`);
        const feeTypeName = parts.join(" + ") || "Manual Customized Fee";

        const payload = {
          studentId: selectedStudent,
          month: feeMonthInput.trim(),
          amount: Number(baseTotal),
          discount: Number(studentDiscountInput) || 0,
          feeType: feeTypeName,
          centerId: activeCenterId,
          billingFrequency: customInvoiceBillingFreq
        };

        const result = await onAddFee(payload);
        if (result) {
          alert(`Invoice issued successfully! Invoice ID: ${result.id}`);
          setStudentDiscountInput(0);
          setIncludeOther(false);
          setOtherAmount(0);
          setOtherDesc("Miscellaneous/Material Fee");
          setFeeMonthInput(getCurrentMonthYear());
        } else {
          alert("Could not raise student fee invoice.");
        }
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
        setFees(prev => prev.filter(f => f.id !== feeId));
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
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);
  const [customPaidDate, setCustomPaidDate] = useState<string>("");
  const [payMethod, setPayMethod] = useState<string>("UPI");
  const [payReference, setPayReference] = useState<string>("");
  const [nextFeeCycle, setNextFeeCycle] = useState<string>("Monthly");
  const [triggeringFeeCheck, setTriggeringFeeCheck] = useState<boolean>(false);

  // Monthly Fee Scheduler Modal States
  const [showSchedulerModal, setShowSchedulerModal] = useState<boolean>(false);
  const [schedulerFreqFilter, setSchedulerFreqFilter] = useState<string>("All");
  const [schedulerTargetMonth, setSchedulerTargetMonth] = useState<string>(() => {
    const mName = new Date().toLocaleString("en-US", { month: "long" });
    const yr = new Date().getFullYear();
    return `${mName} ${yr}`;
  });
  const [schedulerSelectionMap, setSchedulerSelectionMap] = useState<Record<string, {
    checked: boolean;
    amount: number;
    frequency: string;
    reason: string;
    feeType: string;
  }>>({});
  const [isBatchIssuing, setIsBatchIssuing] = useState<boolean>(false);

  const initializeSchedulerSelection = (targetMonth: string) => {
    const activeCenterId = currentUser?.id || "C001";
    const activeStudents = students.filter(s => {
      const isActive = s.status === "Active" || !s.status;
      const matchesCenter = activeCenterId ? (s.centerId === activeCenterId || s.centerId === "C001" || !s.centerId) : true;
      return isActive && matchesCenter;
    });

    const newMap: Record<string, {
      checked: boolean;
      amount: number;
      frequency: string;
      reason: string;
      feeType: string;
    }> = {};

    for (const student of activeStudents) {
      const freq = student.billingFrequency || student.billingType || "Monthly";
      
      // Filter student fees
      const studentFees = fees.filter(f => f.studentId === student.id);
      
      // Check if fee for target month already exists
      const existingForMonth = studentFees.find(f => 
        (f.month || "").toLowerCase().trim() === targetMonth.toLowerCase().trim()
      );

      // Base monthly fee or fallback
      const monthlyFee = Number(student.monthlyFee) || 3000;

      let multiplier = 1;
      if (freq === "Quarterly") multiplier = 3;
      else if (freq === "Half-Yearly") multiplier = 6;
      else if (freq === "Yearly") multiplier = 12;

      const calcAmount = monthlyFee * multiplier;
      const feeTypeDesc = `${freq} Tuition Fee (${targetMonth})`;

      if (existingForMonth) {
        const isPaid = existingForMonth.status === "Paid";
        newMap[student.id] = {
          checked: false, // Unchecked by default if invoice already generated
          amount: existingForMonth.amount || calcAmount,
          frequency: freq,
          reason: isPaid ? `Already Paid (Invoice #${existingForMonth.id})` : `Invoiced - Unpaid (Invoice #${existingForMonth.id})`,
          feeType: feeTypeDesc
        };
      } else {
        newMap[student.id] = {
          checked: true, // CHECKED BY DEFAULT FOR DUE INVOICE!
          amount: calcAmount,
          frequency: freq,
          reason: `Due for ${targetMonth} (${freq})`,
          feeType: feeTypeDesc
        };
      }
    }

    setSchedulerSelectionMap(newMap);
  };

  const handleOpenSchedulerModal = () => {
    initializeSchedulerSelection(schedulerTargetMonth);
    setShowSchedulerModal(true);
  };

  const handleTargetMonthChange = (newMonth: string) => {
    setSchedulerTargetMonth(newMonth);
    initializeSchedulerSelection(newMonth);
  };

  const handleToggleSelectAll = (check: boolean) => {
    setSchedulerSelectionMap(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(sId => {
        const student = students.find(s => s.id === sId);
        const freq = student?.billingFrequency || student?.billingType || "Monthly";
        if (schedulerFreqFilter === "All" || freq === schedulerFreqFilter) {
          if (updated[sId]) {
            updated[sId] = { ...updated[sId], checked: check };
          }
        }
      });
      return updated;
    });
  };

  const handleStudentAmountChange = (studentId: string, newAmt: number) => {
    setSchedulerSelectionMap(prev => {
      if (!prev[studentId]) return prev;
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          amount: newAmt
        }
      };
    });
  };

  const handleToggleStudentChecked = (studentId: string) => {
    setSchedulerSelectionMap(prev => {
      if (!prev[studentId]) return prev;
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          checked: !prev[studentId].checked
        }
      };
    });
  };

  const handleBatchIssueInvoices = async () => {
    const activeCenterId = currentUser?.id || "C001";
    
    const visibleStudents = students.filter(s => {
      const isActive = s.status === "Active" || !s.status;
      const matchesCenter = activeCenterId ? (s.centerId === activeCenterId || s.centerId === "C001" || !s.centerId) : true;
      if (!isActive || !matchesCenter) return false;
      const freq = s.billingFrequency || s.billingType || "Monthly";
      if (schedulerFreqFilter !== "All" && freq !== schedulerFreqFilter) return false;
      return true;
    });

    const selectedInvoices = visibleStudents
      .filter(s => schedulerSelectionMap[s.id]?.checked)
      .map(s => {
        const item = schedulerSelectionMap[s.id];
        return {
          studentId: s.id,
          amount: item.amount,
          feeType: item.feeType,
          billingFrequency: item.frequency,
          month: schedulerTargetMonth
        };
      });

    if (selectedInvoices.length === 0) {
      alert("No students are checked with tick marks. Please select at least one student before generating invoices.");
      return;
    }

    setIsBatchIssuing(true);
    try {
      const res = await fetch("/api/erp/fees/batch-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: activeCenterId,
          month: schedulerTargetMonth,
          invoices: selectedInvoices
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Success! Generated and issued ${data.createdCount} student invoices for ${schedulerTargetMonth}.`);
        setShowSchedulerModal(false);
        if (onRefreshData) {
          await onRefreshData();
        } else {
          window.location.reload();
        }
      } else {
        alert("Batch invoice generation error: " + (data.error || "Failed to issue invoices"));
      }
    } catch (err: any) {
      alert("Network/Server error: " + err.message);
    } finally {
      setIsBatchIssuing(false);
    }
  };

  // Invoice Editing States
  const [editingInvoice, setEditingInvoice] = useState<FeeRecord | null>(null);
  const [editInvoiceAmount, setEditInvoiceAmount] = useState<number>(0);
  const [editInvoiceDiscount, setEditInvoiceDiscount] = useState<number>(0);
  const [editInvoiceMonth, setEditInvoiceMonth] = useState<string>("");
  const [editInvoiceStatus, setEditInvoiceStatus] = useState<string>("");

  // Form Fields
  const [tName, setTName] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [tMobile, setTMobile] = useState("");
  const [tRole, setTRole] = useState("Teacher");
  const [tMonthlySalary, setTMonthlySalary] = useState<number>(0);
  const [tSignature, setTSignature] = useState("");
  const [tEmailNotif, setTEmailNotif] = useState(false);
  const [tCenterIds, setTCenterIds] = useState<string[]>([]);

  const [sCenterId, setSCenterId] = useState("");
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sParent, setSParent] = useState("");
  const [sMobile, setSMobile] = useState("");
  const [sAge, setSAge] = useState(8);
  const [sSchool, setSSchool] = useState("");
  const [sLevel, setSLevel] = useState(1);
  const [sStartingWeek, setSStartingWeek] = useState<number>(1);
  const [sCourseId, setSCourseId] = useState("c_abacus");
  const [sBatch, setSBatch] = useState("auto");
  const [sJoiningDate, setSJoiningDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [sBatchCode, setSBatchCode] = useState("");
  const [sTeacherId, setSTeacherId] = useState("auto");
  const [customBatchVal, setCustomBatchVal] = useState("");
  const [sFeePlan, setSFeePlan] = useState("Manual");

  // Student Search / Filtering States
  const [filterStudentName, setFilterStudentName] = useState("");
  const [filterStudentLevel, setFilterStudentLevel] = useState("All");
  const [filterStudentTeacher, setFilterStudentTeacher] = useState("All");
  const [filterStudentBatch, setFilterStudentBatch] = useState("All");
  const [sBillingType, setSBillingType] = useState<"Monthly" | "Quarterly" | "Half-Yearly" | "Yearly" | "Custom" | "">("Monthly");
  const [sMonthlyFee, setSMonthlyFee] = useState<number | "">(2000);
  const [sBillingDate, setSBillingDate] = useState<number | "">(5);

  // Editing Student States & Handlers
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudentPerformance, setViewingStudentPerformance] = useState<Student | null>(null);
  const [performanceTab, setPerformanceTab] = useState<"practice" | "homework" | "behavior">("practice");
  const [editSName, setEditSName] = useState("");
  const [editSParent, setEditSParent] = useState("");
  const [editSMobile, setEditSMobile] = useState("");
  const [editSAge, setEditSAge] = useState(8);
  const [editSSchool, setEditSSchool] = useState("");
  const [editSLevel, setEditSLevel] = useState(1);
  const [editSStartingWeek, setEditSStartingWeek] = useState<number>(1);
  const [editSCourseId, setEditSCourseId] = useState("");
  const [editSBatch, setEditSBatch] = useState("");
  const [editSBatchCode, setEditSBatchCode] = useState("");
  const [editSTeacherId, setEditSTeacherId] = useState("");
  const [editSEmail, setEditSEmail] = useState("");
  const [editSStatus, setEditSStatus] = useState("Active");
  const [editSFeePlan, setEditSFeePlan] = useState("Manual");
  const [editSBillingType, setEditSBillingType] = useState<"Monthly" | "Quarterly" | "Half-Yearly" | "Yearly" | "Custom" | "">("");
  const [editSMonthlyFee, setEditSMonthlyFee] = useState<number | "">("");
  const [editSBillingDate, setEditSBillingDate] = useState<number | "">("");

  // New Student registration detail fields states
  const [editSDateOfBirth, setEditSDateOfBirth] = useState("");
  const [editSGender, setEditSGender] = useState<"Male" | "Female" | "Other" | "">("");
  const [editSFatherName, setEditSFatherName] = useState("");
  const [editSFatherMobile, setEditSFatherMobile] = useState("");
  const [editSMotherName, setEditSMotherName] = useState("");
  const [editSMotherMobile, setEditSMotherMobile] = useState("");
  const [editSPrimaryContact, setEditSPrimaryContact] = useState<"Father" | "Mother" | "">("");
  const [editSPrimaryNotificationNumber, setEditSPrimaryNotificationNumber] = useState("");
  const [editSAddress, setEditSAddress] = useState("");
  const [editSCity, setEditSCity] = useState("");
  const [editSState, setEditSState] = useState("");
  const [editSPincode, setEditSPincode] = useState("");
  const [editSCountry, setEditSCountry] = useState("India");
  const [editSPassword, setEditSPassword] = useState(""); // empty by default for security, typed value resets it
  const [editSJoiningDate, setEditSJoiningDate] = useState("");
  const [editSLevelStartDate, setEditSLevelStartDate] = useState("");

  // Fee Collection Search & Filter States
  const [feeSearchQuery, setFeeSearchQuery] = useState("");
  const [feeStatusFilter, setFeeStatusFilter] = useState("All");
  const [feeMonthFilter, setFeeMonthFilter] = useState("All");
  const [feeLevelFilter, setFeeLevelFilter] = useState("All");
  
  // Invoice Creation Student Search Filter
  const [selectedStudentSearch, setSelectedStudentSearch] = useState("");

  // Outstanding Dues Tracker Search & Filter
  const [duesSearchQuery, setDuesSearchQuery] = useState("");
  const [duesLevelFilter, setDuesLevelFilter] = useState("All");

  // Editing Teacher States & Handlers
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editTName, setEditTName] = useState("");
  const [editTEmail, setEditTEmail] = useState("");
  const [editTMobile, setEditTMobile] = useState("");
  const [editTRole, setEditTRole] = useState("");
  const [editTSalary, setEditTSalary] = useState<number>(0);
  const [editTSignature, setEditTSignature] = useState("");
  const [editTEmailNotif, setEditTEmailNotif] = useState(false);
  const [editTCenterIds, setEditTCenterIds] = useState<string[]>([]);

  const handleEditTeacherClick = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditTName(teacher.name || "");
    setEditTEmail(teacher.email || "");
    setEditTMobile(teacher.mobile || "");
    setEditTRole(teacher.role || "Teacher");
    setEditTSalary(teacher.monthlySalary || 0);
    setEditTSignature(teacher.signatureUrl || teacher.signature || "");
    setEditTEmailNotif(!!teacher.emailNotificationsEnabled);
    setEditTCenterIds(teacher.centerIds && teacher.centerIds.length > 0 ? teacher.centerIds : [teacher.centerId || activeCenterId]);
  };

  const handleUpdateTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      const resolvedCenterIds = editTCenterIds.length > 0 ? editTCenterIds : [editingTeacher.centerId || activeCenterId];
      const res = await fetch("/api/erp/update-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: editingTeacher.id,
          name: editTName.trim(),
          email: editTEmail.trim(),
          mobile: editTMobile.trim(),
          role: editTRole,
          monthlySalary: Number(editTSalary) || 0,
          signatureUrl: editTSignature,
          signature: editTSignature,
          emailNotificationsEnabled: editTEmailNotif,
          centerIds: resolvedCenterIds
        })
      });
      const data = await res.json();
      if (data.success) {
        await logCenterActivity("Update Instructor Profile", `Updated contact/salary/signature details for ${editTName} (${editingTeacher.id})`);
        setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? { 
          ...t, 
          name: editTName.trim(),
          email: editTEmail.trim(),
          mobile: editTMobile.trim(),
          role: editTRole,
          monthlySalary: Number(editTSalary) || 0,
          signatureUrl: editTSignature,
          signature: editTSignature,
          emailNotificationsEnabled: editTEmailNotif,
          centerIds: resolvedCenterIds
        } : t));
        setEditingTeacher(null);
      } else {
        alert(data.error || "Failed to update teacher profile.");
      }
    } catch (err) {
      console.error("Error updating teacher:", err);
      alert("Error contacting the server.");
    }
  };

  const handleToggleAllStaffNotifications = async (enable: boolean) => {
    try {
      const res = await fetch("/api/erp/toggle-all-teachers-email-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId: activeCenterId, enabled: enable })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        setTeachers(prev => prev.map(t => ({ ...t, emailNotificationsEnabled: enable })));
        if (onRefreshData) await onRefreshData();
      } else {
        alert("⚠️ " + (data.error || "Failed to update staff email notification status"));
      }
    } catch (err: any) {
      alert("⚠️ Failed to update staff notifications: " + err.message);
    }
  };

  // Derived Student search and filter collections
  const uniqueBatches = Array.from(new Set(students.map(s => s.batch).filter(Boolean)));
  const uniqueLevels = Array.from(new Set(students.map(s => s.currentLevel).filter(l => l !== undefined && l !== null))).sort((a, b) => Number(a) - Number(b));

  const filteredStudents = students.filter(s => {
    if (filterStudentName && !s.studentName.toLowerCase().includes(filterStudentName.toLowerCase())) {
      return false;
    }
    if (filterStudentLevel !== "All" && String(s.currentLevel) !== String(filterStudentLevel)) {
      return false;
    }
    if (filterStudentTeacher !== "All" && s.teacherId !== filterStudentTeacher) {
      return false;
    }
    if (filterStudentBatch !== "All" && s.batch !== filterStudentBatch) {
      return false;
    }
    return true;
  });

  // Auto-calculate age in edit modal when DOB changes
  useEffect(() => {
    if (editSDateOfBirth) {
      const today = new Date();
      const birthDate = new Date(editSDateOfBirth);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setEditSAge(calculatedAge >= 0 ? calculatedAge : 0);
    }
  }, [editSDateOfBirth]);

  // Auto-populate notification number in edit modal
  useEffect(() => {
    if (editSPrimaryContact === "Father") {
      setEditSPrimaryNotificationNumber(editSFatherMobile);
    } else if (editSPrimaryContact === "Mother") {
      setEditSPrimaryNotificationNumber(editSMotherMobile);
    }
  }, [editSPrimaryContact, editSFatherMobile, editSMotherMobile]);

  const startEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditSName(student.studentName || "");
    setEditSParent(student.parentName || "");
    setEditSMobile(student.parentMobile || "");
    setEditSAge(student.age || 8);
    setEditSSchool(student.school || "");
    setEditSLevel(student.currentLevel !== undefined && student.currentLevel !== null ? student.currentLevel : 1);
    setEditSStartingWeek(student.startingWeek !== undefined ? Number(student.startingWeek) : 1);
    setEditSCourseId(student.courseId || "c_abacus");
    setEditSBatch(student.batch || "");
    setEditSBatchCode(student.batchCode || "");
    setEditSTeacherId(student.teacherId || "");
    setEditSEmail(student.email || "");
    setEditSStatus(student.status || "Active");
    setEditSFeePlan(student.feePlan || "Manual");
    setEditSBillingType(student.billingType || "Monthly");
    setEditSMonthlyFee(student.monthlyFee !== undefined ? student.monthlyFee : 2000);
    setEditSBillingDate(student.billingDate !== undefined ? student.billingDate : 5);
    
    // Populate new fields
    setEditSDateOfBirth(student.dateOfBirth || "");
    setEditSGender(student.gender || "");
    setEditSFatherName(student.fatherName || "");
    setEditSFatherMobile(student.fatherMobile || "");
    setEditSMotherName(student.motherName || "");
    setEditSMotherMobile(student.motherMobile || "");
    setEditSPrimaryContact(student.primaryContact || "");
    setEditSPrimaryNotificationNumber(student.primaryNotificationNumber || "");
    setEditSAddress(student.address || "");
    setEditSCity(student.city || "");
    setEditSState(student.state || "");
    setEditSPincode(student.pincode || "");
    setEditSCountry(student.country || "India");
    setEditSPassword("");
    const defaultJoin = student.joiningDate || new Date().toISOString().split("T")[0];
    setEditSJoiningDate(defaultJoin);
    setEditSLevelStartDate(student.levelStartDate || defaultJoin);
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    if (editSStatus === "Active" && editingStudent.status !== "Active") {
      const activeCount = students.filter(s => s.status === "Active").length;
      const limit = activeCenter?.studentLimit !== undefined ? Number(activeCenter.studentLimit) : (activeCenter?.planType === "Custom" ? 25 : 10);
      if (activeCount >= limit) {
        alert(`Student limit reached. Your current subscription allows up to ${limit} active students. Please contact your administrator or upgrade your plan.`);
        return;
      }
    }

    const payload: Partial<Student> = {
      id: editingStudent.id,
      studentName: editSName.trim(),
      parentName: (editSPrimaryContact === "Father" ? editSFatherName : editSMotherName).trim() || editSParent.trim(),
      parentMobile: (editSPrimaryContact === "Father" ? editSFatherMobile : editSMotherMobile).trim() || editSMobile.trim(),
      age: Number(editSAge),
      school: editSSchool.trim(),
      currentLevel: Number(editSLevel),
      startingWeek: Number(editSStartingWeek),
      courseId: editSCourseId,
      batch: editSBatch.trim(),
      batchCode: editSBatchCode.trim(),
      teacherId: editSTeacherId,
      email: editSEmail.trim(),
      status: editSStatus,
      feePlan: "Manual",
      billingType: undefined,
      monthlyFee: undefined,
      billingDate: undefined,
      
      // Save new fields
      dateOfBirth: editSDateOfBirth,
      gender: editSGender || undefined,
      fatherName: editSFatherName.trim(),
      fatherMobile: editSFatherMobile.trim(),
      motherName: editSMotherName.trim(),
      motherMobile: editSMotherMobile.trim(),
      primaryContact: editSPrimaryContact || undefined,
      primaryNotificationNumber: editSPrimaryNotificationNumber.trim(),
      address: editSAddress.trim(),
      city: editSCity.trim(),
      state: editSState.trim(),
      pincode: editSPincode.trim(),
      country: editSCountry || "India",
      password: editSPassword !== "" ? editSPassword : undefined,
      joiningDate: editSJoiningDate,
      levelStartDate: editSLevelStartDate
    };

    if (onEditStudent) {
      onEditStudent(payload);
    }
    
    // Also update local state
    setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...s, ...payload } : s));
    setEditingStudent(null);
  };

  const handleLocalDeleteStudent = (studentId: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete student ${name}? This action cannot be undone.`)) {
      if (onDeleteStudent) {
        onDeleteStudent(studentId);
      }
      setStudents(prev => prev.filter(s => s.id !== studentId));
    }
  };

  // Center Payment Configurations States
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [notificationSending, setNotificationSending] = useState<string | null>(null);

  // Center Academy Branding States
  const [academyName, setAcademyName] = useState("");
  const [academyLogo, setAcademyLogo] = useState("");
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [examFeeMandatory, setExamFeeMandatory] = useState(false);

  // Email Notification & Sender Configuration States
  const [notificationEmail, setNotificationEmail] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [ccEmails, setCcEmails] = useState("");
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [emailNotifyNewLead, setEmailNotifyNewLead] = useState(true);
  const [emailNotifyFeeReceipt, setEmailNotifyFeeReceipt] = useState(true);
  const [emailNotifyStudentAttendance, setEmailNotifyStudentAttendance] = useState(true);
  const [emailNotifyHomeworkSubmitted, setEmailNotifyHomeworkSubmitted] = useState(false);
  const [emailNotifyTeacherSubmissions, setEmailNotifyTeacherSubmissions] = useState(false);
  const [emailNotifySystemUpdates, setEmailNotifySystemUpdates] = useState(true);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [showSmtpDetails, setShowSmtpDetails] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [showEmailLogs, setShowEmailLogs] = useState(true);

  // Granular Role-Based Email Notification Preferences
  const [rolePreferences, setRolePreferences] = useState<any>({
    superAdmin: { enabled: true, subscriptionInvoices: true, paymentStatusAlerts: true, expiringSoonAlerts: true, studentQuotaWarnings: true },
    centerAdmin: { enabled: true, newInquiryLeads: true, feePaymentReceipts: true, studentAttendanceAlerts: true, homeworkSubmissions: false, dailyPracticeSummary: true, examPrepAlerts: true },
    manager: { enabled: false, dailyRevenueSummary: true, inquiryLeadAlerts: true, feeReceiptAlerts: true, attendanceAlerts: true, examPrepAlerts: true },
    marketingSales: { enabled: false, newInquiryLeads: true, followUpReminders: true, campaignSummaries: false },
    teacher: { enabled: true, assignedStudentSubmissions: false, dailyPracticeDigest: true, examPrepAlerts: true, attendanceAlerts: true },
    parentStudent: { enabled: false, feePaymentReceipts: true, practiceProgressReports: true, examPrepNotifications: true, classAttendanceAlerts: true }
  });

  // Ref to track which center was last initialized to avoid overwriting user edits on background poll refreshes
  const lastInitializedCenterIdRef = React.useRef<string | null>(null);


  // Material Management States
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [matStudentId, setMatStudentId] = useState("");
  const [matMaterialFee, setMatMaterialFee] = useState(1200);
  const [matBookFee, setMatBookFee] = useState(600);
  const [matCourierFee, setMatCourierFee] = useState(150);
  const [matStatus, setMatStatus] = useState("Pending");
  const [matTracking, setMatTracking] = useState("");
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [editMatStatus, setEditMatStatus] = useState("Pending");
  const [editMatTracking, setEditMatTracking] = useState("");
  const [editMatMaterialFee, setEditMatMaterialFee] = useState(1200);
  const [editMatBookFee, setEditMatBookFee] = useState(600);
  const [editMatCourierFee, setEditMatCourierFee] = useState(150);

  React.useEffect(() => {
    const centerObj = (centers || []).find(c => c.id === activeCenterId) as any;
    if (centerObj && lastInitializedCenterIdRef.current !== activeCenterId) {
      setUpiId(centerObj.upiId || "");
      setBankDetails(centerObj.bankDetails || "");
      setQrCode(centerObj.qrCode || "");
      setAcademyName(centerObj.name || "");
      setAcademyLogo(centerObj.logo || "");
      setExamFeeMandatory(!!centerObj.examFeeMandatoryBeforePromotion);

      setNotificationEmail(centerObj.notificationEmail || centerObj.email || "");
      setSenderEmail(centerObj.senderEmail || centerObj.email || "");
      setCcEmails(centerObj.ccEmails || "");
      setEmailNotificationsEnabled(centerObj.emailNotificationsEnabled !== false);
      setEmailNotifyNewLead(centerObj.emailNotifyNewLead !== false);
      setEmailNotifyFeeReceipt(centerObj.emailNotifyFeeReceipt !== false);
      setEmailNotifyStudentAttendance(centerObj.emailNotifyStudentAttendance !== false);
      setEmailNotifyHomeworkSubmitted(centerObj.emailNotifyHomeworkSubmitted === true);
      setEmailNotifyTeacherSubmissions(centerObj.emailNotifyTeacherSubmissions === true);
      setEmailNotifySystemUpdates(centerObj.emailNotifySystemUpdates !== false);
      setSmtpHost(centerObj.smtpHost || "");
      setSmtpPort(centerObj.smtpPort || 587);
      setSmtpUser(centerObj.smtpUser || "");
      setSmtpPass(centerObj.smtpPass || "");

      if (centerObj.roleNotificationPreferences) {
        setRolePreferences({
          superAdmin: { enabled: true, subscriptionInvoices: true, paymentStatusAlerts: true, expiringSoonAlerts: true, studentQuotaWarnings: true, ...centerObj.roleNotificationPreferences.superAdmin },
          centerAdmin: { enabled: true, newInquiryLeads: true, feePaymentReceipts: true, studentAttendanceAlerts: true, homeworkSubmissions: false, dailyPracticeSummary: true, examPrepAlerts: true, ...centerObj.roleNotificationPreferences.centerAdmin },
          manager: { enabled: false, dailyRevenueSummary: true, inquiryLeadAlerts: true, feeReceiptAlerts: true, attendanceAlerts: true, examPrepAlerts: true, ...centerObj.roleNotificationPreferences.manager },
          marketingSales: { enabled: false, newInquiryLeads: true, followUpReminders: true, campaignSummaries: false, ...centerObj.roleNotificationPreferences.marketingSales },
          teacher: { enabled: true, assignedStudentSubmissions: false, dailyPracticeDigest: true, examPrepAlerts: true, attendanceAlerts: true, ...centerObj.roleNotificationPreferences.teacher },
          parentStudent: { enabled: false, feePaymentReceipts: true, practiceProgressReports: true, examPrepNotifications: true, classAttendanceAlerts: true, ...centerObj.roleNotificationPreferences.parentStudent }
        });
      }

      lastInitializedCenterIdRef.current = activeCenterId;
    }
  }, [centers, activeCenterId]);

  const handleToggleExamFeeMandatory = async (isMandatory: boolean) => {
    setExamFeeMandatory(isMandatory);
    try {
      const res = await fetch("/api/erp/update-center-promotion-setting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: activeCenterId,
          examFeeMandatoryBeforePromotion: isMandatory
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        alert("Failed to update level promotion setting: " + data.error);
      }
    } catch (err: any) {
      alert("Error saving setting: " + err.message);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matStudentId) {
      alert("Please select a student for material dispatch tracking.");
      return;
    }
    try {
      const res = await fetch("/api/erp/add-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: activeCenterId,
          studentId: matStudentId,
          materialFee: Number(matMaterialFee),
          bookFee: Number(matBookFee),
          courierFee: Number(matCourierFee),
          dispatchStatus: matStatus,
          trackingNumber: matTracking || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        logCenterActivity("Material Dispatch", `Dispatched books/materials to student ID ${matStudentId} (Status: "${matStatus}", Tracking: "${matTracking || "N/A"}")`);
        alert("Material dispatch record added successfully!");
        setShowAddMaterial(false);
        setMatStudentId("");
        setMatTracking("");
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        alert("Failed to add material record: " + data.error);
      }
    } catch (err: any) {
      alert("Error saving dispatch record: " + err.message);
    }
  };

  const handleUpdateMaterialStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    try {
      const res = await fetch("/api/erp/update-material-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMaterial.id,
          dispatchStatus: editMatStatus,
          trackingNumber: editMatTracking,
          materialFee: Number(editMatMaterialFee),
          bookFee: Number(editMatBookFee),
          courierFee: Number(editMatCourierFee)
        })
      });
      const data = await res.json();
      if (data.success) {
        logCenterActivity("Material Dispatch", `Updated dispatch record ID ${editingMaterial.id} status to "${editMatStatus}" (Tracking: "${editMatTracking || "N/A"}")`);
        alert("Material dispatch status updated successfully!");
        setEditingMaterial(null);
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        alert("Failed to update status: " + data.error);
      }
    } catch (err: any) {
      alert("Error saving updates: " + err.message);
    }
  };

  const handleSaveBrandingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyName.trim()) {
      alert("Academy Name cannot be blank.");
      return;
    }
    setBrandingSaving(true);
    try {
      const res = await fetch("/api/erp/update-center-branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: activeCenterId,
          name: academyName,
          logo: academyLogo
        })
      });
      const data = await res.json();
      if (data.success) {
        lastInitializedCenterIdRef.current = null; // force re-initialization with saved data
        alert("Academy custom name and logo branding updated successfully! All your teachers and students will see the updated branding instantly.");
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        alert("Failed to save branding settings: " + data.error);
      }
    } catch (err: any) {
      alert("Error saving branding settings: " + err.message);
    } finally {
      setBrandingSaving(false);
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImageBase64(reader.result as string, 400, 150, 0.75);
          setAcademyLogo(compressed);
        } catch (err) {
          console.error("Error compressing logo image:", err);
          setAcademyLogo(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [eCategory, setECategory] = useState<any>("Miscellaneous");
  const [eAmount, setEAmount] = useState<number>(0);
  const [eDesc, setEDesc] = useState("");

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName) return;
    const payload = {
      centerId: activeCenterId,
      centerIds: tCenterIds.length > 0 ? tCenterIds : [activeCenterId],
      name: tName,
      email: tEmail,
      mobile: tMobile,
      role: tRole,
      monthlySalary: Number(tMonthlySalary) || 0,
      signatureUrl: tSignature,
      signature: tSignature,
      emailNotificationsEnabled: tEmailNotif
    };
    onAddTeacher(payload).then((savedTeacher) => {
      if (savedTeacher) {
        setTeachers(prev => [...prev, savedTeacher]);
        if (onRefreshData) onRefreshData();
      }
    });

    setTName("");
    setTEmail("");
    setTMobile("");
    setTMonthlySalary(0);
    setTSignature("");
    setTCenterIds([]);
    setShowAddTeacher(false);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName) return;

    // Count active students in this center
    const activeCount = students.filter(s => s.status === "Active").length;
    const limit = activeCenter?.studentLimit !== undefined ? Number(activeCenter.studentLimit) : (activeCenter?.planType === "Custom" ? 25 : 10);
    if (activeCount >= limit) {
      alert(`Student limit reached. Your current subscription allows up to ${limit} active students. Please contact your administrator or upgrade your plan.`);
      return;
    }

    const finalBatch = sBatch === "Custom" ? customBatchVal : sBatch;
    const matchedCourse = courses.find(c => c.id === sCourseId);
    const resolvedCourseName = matchedCourse ? matchedCourse.name : (
      sCourseId === "c_abacus" ? "Abacus" :
      sCourseId === "c_rubik" ? "Rubik's Cube" :
      sCourseId === "c_vedic" ? "Vedic Maths" :
      sCourseId === "c_chess" ? "Chess" :
      sCourseId === "c_coding" ? "Coding" : "Abacus"
    );

    const payload = {
      centerId: sCenterId || (selectedBranchId !== "ALL" ? selectedBranchId : activeCenterId),
      teacherId: sTeacherId || "T001",
      studentName: sName,
      email: sEmail.trim() || undefined,
      parentName: sParent,
      parentMobile: sMobile,
      age: sAge,
      school: sSchool,
      currentLevel: sLevel,
      startingWeek: sStartingWeek,
      courseId: sCourseId,
      courseName: resolvedCourseName,
      batch: finalBatch,
      batchCode: sBatchCode.trim(),
      feePlan: "Manual",
      billingType: undefined,
      monthlyFee: undefined,
      billingDate: undefined,
      billingFrequency: sBillingType || "Monthly",
      joiningDate: sJoiningDate,
      levelStartDate: sJoiningDate
    };
    onAddStudent(payload).then((savedStudent) => {
      if (savedStudent) {
        setStudents(prev => [...prev, savedStudent]);
        if (onRefreshData) onRefreshData();
      }
    });
    setSName(""); setSEmail(""); setSParent(""); setSMobile(""); setSSchool(""); setSStartingWeek(1); setSBatchCode(""); setSJoiningDate(new Date().toISOString().split("T")[0]); setShowAddStudent(false);
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
    setPayingFeeId(feeId);
    setCustomPaidDate(new Date().toISOString().split("T")[0]);
    setPayMethod("UPI");
    setPayReference("");
    const targetFee = fees.find(f => f.id === feeId);
    const sObj = targetFee ? students.find(s => s.id === targetFee.studentId) : null;
    setNextFeeCycle(sObj?.billingFrequency || sObj?.billingType || "Monthly");
  };

  const handleConfirmFeePayment = () => {
    if (!payingFeeId) return;
    onPayFee(payingFeeId, customPaidDate, payMethod, payReference, nextFeeCycle);
    setFees(prev =>
      prev.map(f => f.id === payingFeeId ? {
        ...f,
        status: "Paid",
        paidDate: customPaidDate,
        paymentMethod: payMethod,
        referenceNumber: payReference,
        billingFrequency: nextFeeCycle
      } : f)
    );
    setStudents(prev =>
      prev.map(s => {
        const targetFee = fees.find(f => f.id === payingFeeId);
        if (targetFee && s.id === targetFee.studentId) {
          return { ...s, billingFrequency: nextFeeCycle, billingType: nextFeeCycle as any };
        }
        return s;
      })
    );
    setPayingFeeId(null);
  };

  const handleTriggerFeeAssignment = async () => {
    setTriggeringFeeCheck(true);
    try {
      const activeCenterId = currentUser?.id || "C001";
      const res = await fetch("/api/erp/fees/trigger-monthly-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId: activeCenterId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Success! 1st of month automated fee assignments check completed.\n\nAssigned: ${data.assignedCount} student invoices generated and notifications sent.\n\nDetails: ${data.details || 'None'}`);
        if (onRefreshData) {
          onRefreshData();
        } else {
          window.location.reload();
        }
      } else {
        alert("Error running scheduler: " + data.error);
      }
    } catch (err: any) {
      alert("Request error: " + err.message);
    } finally {
      setTriggeringFeeCheck(false);
    }
  };

  const handleLocalMarkUnpaid = async (feeId: string) => {
    if (confirm("Are you sure you want to mark this fee invoice as Unpaid?")) {
      if (onUnpayFee) {
        try {
          const updated = await onUnpayFee(feeId);
          if (updated) {
            setFees(prev => prev.map(f => f.id === feeId ? updated : f));
            alert("Invoice status updated to Unpaid.");
          }
        } catch (err: any) {
          alert("Failed to update status: " + err.message);
        }
      } else {
        setFees(prev => prev.map(f => f.id === feeId ? { ...f, status: "Unpaid", paidDate: undefined } : f));
      }
    }
  };

  const handleStartEditInvoice = (fee: FeeRecord) => {
    setEditingInvoice(fee);
    setEditInvoiceAmount(fee.amount);
    setEditInvoiceDiscount(fee.discount);
    setEditInvoiceMonth(fee.month);
    setEditInvoiceStatus(fee.status);
  };

  const handleSaveEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    const payload = {
      feeId: editingInvoice.id,
      amount: editInvoiceAmount,
      discount: editInvoiceDiscount,
      month: editInvoiceMonth,
      status: editInvoiceStatus
    };
    if (onUpdateFee) {
      try {
        const updated = await onUpdateFee(payload);
        if (updated) {
          setFees(prev => prev.map(f => f.id === editingInvoice.id ? updated : f));
          alert("Invoice details updated successfully.");
        }
      } catch (err: any) {
        alert("Failed to update invoice: " + err.message);
      }
    } else {
      setFees(prev => prev.map(f => f.id === editingInvoice.id ? { 
        ...f, 
        amount: editInvoiceAmount, 
        discount: editInvoiceDiscount, 
        month: editInvoiceMonth, 
        status: editInvoiceStatus,
        paidDate: editInvoiceStatus === "Paid" ? f.paidDate || new Date().toISOString().split("T")[0] : undefined
      } : f));
    }
    setEditingInvoice(null);
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
      // Find all unpaid or pending fee records for this student
      const unpaidInvoices = fees.filter(f => f.studentId === studentId && f.status === "Unpaid");
      
      let invoiceDetailsMsg = "";
      if (unpaidInvoices.length > 0) {
        invoiceDetailsMsg = unpaidInvoices.map((inv, idx) => {
          const discount = inv.discount || 0;
          const basePrice = inv.amount;
          const netPrice = basePrice - discount;
          const dueDate = `10th of ${inv.month || "Current Month"}`;
          return `\nInvoice #${idx + 1}:
• Student Name: ${studentName}
• Invoice No: ${inv.id}
• Fee Type: ${inv.feeType || "Level Tuition Fee"} (${inv.month})
• Due Date: ${dueDate}
• Base Amount: ₹${basePrice}
• Discount Applied: ₹${discount}
• Net Pending Amount: ₹${netPrice}`;
        }).join("\n");
      } else {
        invoiceDetailsMsg = `\nInvoice Details:
• Student Name: ${studentName}
• Invoice No: INV-${studentId.slice(-4)}-PEND
• Fee Type: Level ${currentLevel} Tuition Fees
• Due Date: 10th of current month
• Total Amount: ₹${amount}
• Paid Amount: ₹0
• Pending Amount: ₹${amount}`;
      }

      const fullMessage = `Dear Parent, please find the outstanding invoice reminder for your ward ${studentName}.

Pending Invoice Information:${invoiceDetailsMsg}

Kindly pay the pending amount via UPI/Bank transfer and upload the payment proof screenshots inside your student dashboard. Thank you!`;

      const res = await fetch("/api/erp/send-student-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          title: "Tuition Fee Outstanding Reminder",
          message: fullMessage,
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
      const unpaidInvoices = fees.filter(f => f.studentId === studentId && f.status === "Unpaid");
      let invoiceDetailsMsg = "";
      if (unpaidInvoices.length > 0) {
        invoiceDetailsMsg = unpaidInvoices.map((inv, idx) => {
          const discount = inv.discount || 0;
          const basePrice = inv.amount;
          const netPrice = basePrice - discount;
          const dueDate = `10th of ${inv.month || "Current Month"}`;
          return `\nInvoice #${idx + 1}:
• Student Name: ${studentName}
• Invoice No: ${inv.id}
• Fee Type: ${inv.feeType || "Level Tuition Fee"} (${inv.month})
• Due Date: ${dueDate}
• Net Pending Amount: ₹${netPrice}`;
        }).join("\n");
      } else {
        invoiceDetailsMsg = `\nInvoice Details:
• Student Name: ${studentName}
• Pending Amount: ₹${amount}`;
      }

      const fullMessage = `Dear Parent, please find the outstanding fee invoice reminder for your ward ${studentName}.\n\nPending Invoice Breakdown:${invoiceDetailsMsg}\n\nKindly pay the pending amount via UPI/Bank transfer and upload the payment proof screenshot inside your student portal. Thank you!`;

      const res = await fetch("/api/erp/send-fee-email-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          title: `⏰ Tuition Fee Outstanding Reminder: ${studentName}`,
          message: fullMessage
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
      alert("Error dispatching email notification.");
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
        lastInitializedCenterIdRef.current = null; // force re-initialization with saved data
        alert("Payment settings (UPI, Bank details, QR code) successfully updated and published to student dashboards!");
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        alert("Failed to save payment settings: " + data.error);
      }
    } catch (err: any) {
      alert("Error saving settings: " + err.message);
    } finally {
      setPaymentSaving(false);
    }
  };

  const fetchEmailLogs = async () => {
    if (!activeCenterId) return;
    try {
      const res = await fetch(`/api/erp/email-notification-logs?centerId=${activeCenterId}`);
      const data = await res.json();
      if (data.success) {
        setEmailLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Error fetching email logs:", e);
    }
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSaving(true);
    try {
      const res = await fetch("/api/erp/update-center-email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: activeCenterId,
          notificationEmail,
          senderEmail,
          ccEmails,
          emailNotificationsEnabled,
          emailNotifyNewLead,
          emailNotifyFeeReceipt,
          emailNotifyStudentAttendance,
          emailNotifyHomeworkSubmitted,
          emailNotifyTeacherSubmissions,
          emailNotifySystemUpdates,
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
          roleNotificationPreferences: rolePreferences
        })
      });
      const data = await res.json();
      if (data.success) {
        lastInitializedCenterIdRef.current = null; // force re-initialization with updated center object
        alert("Success! Center notification preferences, role toggles, registered emails, and sender configuration saved.");
        if (onRefreshData) {
          await onRefreshData();
        }
        fetchEmailLogs();
      } else {
        alert("Failed to save email settings: " + data.error);
      }
    } catch (err: any) {
      alert("Error saving email settings: " + err.message);
    } finally {
      setEmailSaving(false);
    }
  };

  const handleSendTestEmail = async (testType: string = "general", roleCategory?: string) => {
    setTestEmailLoading(true);
    try {
      const res = await fetch("/api/erp/send-test-email-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: activeCenterId,
          testType,
          roleCategory
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Success! Test email notification dispatched.\n\nRecipient: ${notificationEmail || "registered email"}\nSender: ${senderEmail || "notifications@geniplus.com"}\n\nReview the sent log entry in the 'Sent Email Logs' section.`);
        setShowEmailLogs(true);
        fetchEmailLogs();
      } else {
        alert("Failed to send test email: " + data.error);
      }
    } catch (err: any) {
      alert("Error sending test email: " + err.message);
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImageBase64(reader.result as string, 500, 500, 0.75);
          setQrCode(compressed);
        } catch (err) {
          console.error("Error compressing QR Code image:", err);
          setQrCode(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Fees Collected Month Filter State
  const [selectedFeeCollectedMonth, setSelectedFeeCollectedMonth] = useState<string>(() => getCurrentMonthYear());

  // P&L Calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const totalExpectedFees = fees.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalCollectedFees = fees.filter(f => f.status === "Paid").reduce((acc, curr) => acc + ((Number(curr.amount) || 0) - (Number(curr.discount) || 0)), 0);
  const totalOutstandingFees = fees.filter(f => f.status === "Unpaid").reduce((acc, curr) => acc + ((Number(curr.amount) || 0) - (Number(curr.discount) || 0)), 0);
  const totalUpcomingFees = fees.filter(f => f.status === "Unpaid" && (!f.dueDate || f.dueDate >= todayStr)).reduce((acc, curr) => acc + ((Number(curr.amount) || 0) - (Number(curr.discount) || 0)), 0);
  const totalOverdueFees = fees.filter(f => f.status === "Unpaid" && (f.dueDate && f.dueDate < todayStr)).reduce((acc, curr) => acc + ((Number(curr.amount) || 0) - (Number(curr.discount) || 0)), 0);

  // Month-filtered collected fees calculation
  const filteredPaidFeesForMonth = fees.filter(f => {
    if (f.status !== "Paid") return false;
    if (selectedFeeCollectedMonth === "All") return true;
    if (f.month && f.month.trim().toLowerCase() === selectedFeeCollectedMonth.trim().toLowerCase()) return true;
    if (f.paidDate) {
      const pDate = new Date(f.paidDate);
      if (!isNaN(pDate.getTime())) {
        const pMonthStr = pDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        if (pMonthStr.toLowerCase() === selectedFeeCollectedMonth.trim().toLowerCase()) return true;
      }
    }
    const dateStr = f.createdAt || f.issueDate;
    if (dateStr) {
      const dObj = new Date(dateStr);
      if (!isNaN(dObj.getTime())) {
        const mStr = dObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        if (mStr.toLowerCase() === selectedFeeCollectedMonth.trim().toLowerCase()) return true;
      }
    }
    return false;
  });

  const monthlyCollectedFees = filteredPaidFeesForMonth.reduce((acc, curr) => acc + ((Number(curr.amount) || 0) - (Number(curr.discount) || 0)), 0);

  const totalRevenues = totalCollectedFees;
  const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalOutstanding = totalOutstandingFees;
  const netEarnings = totalRevenues - totalExpenses;

  if (!isActuallyLoggedIn) {
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
            Local Venture/Academy administrator access. Onboard teachers, audit fee payments, record bills, and track real-time Profit & Loss ledgers.
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

      {/* AOS Subscription Billing Alert Notice */}
      {unpaidSaaSInvoices.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 animate-pulse" id="aos-billing-warning-alert">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">⚠️ Abacus Academy Operating System (AOS) Subscription Payment Due!</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Your annual fee of <strong className="text-rose-600">₹{unpaidSaaSInvoices[0].amount.toLocaleString()}</strong> for the {unpaidSaaSInvoices[0].planName} is currently {unpaidSaaSInvoices[0].status.toLowerCase()}. Please settle immediately to prevent AOS service interruption.
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setSubTab("AOS Subscription");
              setTimeout(() => {
                const el = document.getElementById("center-admin-view");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 shrink-0"
          >
            Pay & Settle AOS Subscription
          </button>
        </div>
      )}

      {/* Trial Center Sandbox Banner */}
      {(activeCenter?.isTrial || activeCenter?.name?.includes("Trial")) && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 border-2 border-emerald-500/50 text-white rounded-3xl p-5 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in" id="trial-sandbox-banner">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 border border-emerald-500/30">
              🚀
            </div>
            <div>
              <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Center Admin Sandbox Mode
              </span>
              <h3 className="text-lg font-black text-white font-display mt-1">
                Full-Access Center Admin Trial
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Isolated sandbox mode for teacher trainees. Test student enrolment, class scheduling, attendance, and receipt printing safely.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-emerald-300 uppercase block">Trial Validity</span>
              <span className="text-sm font-black text-white font-display">
                {activeCenter?.trialExpiryDate ? `Expires: ${activeCenter.trialExpiryDate}` : "30 Days Active"}
              </span>
            </div>
            <button
              onClick={() => {
                alert(`Contact Franchise Admin to convert '${activeCenterName}' into a permanent full paid subscription center!`);
              }}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-2xl shadow-lg transition-all cursor-pointer active:scale-95"
            >
              Convert to Paid License
            </button>
          </div>
        </div>
      )}

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
        <div className="flex flex-wrap gap-2 items-center">
          {isAlsoWorksAsTeacher && onToggleDashboardTab && (
            <button
              onClick={() => onToggleDashboardTab("teacher")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
              id="enter-teacher-mode"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>🎓 Enter Teacher Mode</span>
            </button>
          )}
          <button
            onClick={handleAdminLogout}
            className="bg-indigo-800 hover:bg-rose-700 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-200 flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Admin Console</span>
          </button>
        </div>
      </div>
      
      {/* Multi-Center Network Banner & Switcher */}
      {(activeCenter?.isSuperCenter || activeCenter?.planType === "Multi-Center / Super Center" || (centers && centers.length > 1)) && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-slate-900/5 border-2 border-amber-300/80 rounded-3xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  Super Center Franchise
                </span>
                <span className="text-xs font-extrabold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {centers.length} {centers.length === 1 ? "Branch" : "Connected Network Branches"}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-1">
                Multi-Center Network Control Console
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white border-2 border-amber-300/80 rounded-2xl px-3.5 py-2 shadow-xs w-full sm:w-auto">
              <Landmark className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-extrabold text-slate-700 shrink-0">Branch View:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 outline-none cursor-pointer w-full sm:w-auto"
              >
                <option value="ALL">🌐 All Branches (Consolidated View)</option>
                {centers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id === activeCenterId ? `👑 ${c.name} (Main Center - ${c.id})` : `🏢 ${c.name} (${c.city || "Branch"} - ${c.id})`}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setSubTab("MultiCenter" as any)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-4 py-2.5 rounded-2xl transition-all shadow-md shadow-amber-200/50 flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Network & Branches</span>
            </button>
          </div>
        </div>
      )}

      {/* Top statistics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
          <div>
            <div className="text-[10px] font-black text-indigo-900/60 uppercase tracking-wider">AOS Subscription</div>
            <div className="text-xs font-black text-indigo-950 mt-1 font-display">
              {activeCenter?.planType === "Custom"
                ? `Custom Plan (${activeCenter?.studentLimit || 25} Students)`
                : `${activeCenter?.plan || "Starter Plan"} (${activeCenter?.studentLimit || 10} Students)`}
            </div>
            <div className="text-[11px] font-bold text-slate-600 mt-2">
              Students Used: <span className="font-extrabold text-indigo-950">{students.filter(s => s.status === "Active").length} / {activeCenter?.studentLimit || (activeCenter?.planType === "Custom" ? 25 : 10)}</span>
            </div>
            <div className="text-[11px] font-bold text-slate-600">
              Remaining Seats: <span className="font-extrabold text-emerald-600">{Math.max(0, (activeCenter?.studentLimit || (activeCenter?.planType === "Custom" ? 25 : 10)) - students.filter(s => s.status === "Active").length)}</span>
            </div>
          </div>
          <div className="text-[9px] text-indigo-800/80 mt-2 flex items-center gap-1 font-extrabold">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span>Active Contract</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Active Roster</div>
          <div className="text-2xl md:text-3xl font-black text-indigo-900 mt-1 font-display leading-tight">{students.length} Students</div>
          <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Level 1 to 8 curriculum</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 mb-1">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">Fees Collected</div>
            <select
              value={selectedFeeCollectedMonth}
              onChange={(e) => setSelectedFeeCollectedMonth(e.target.value)}
              className="text-[10px] font-extrabold bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-indigo-700 cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500 max-w-full truncate"
            >
              <option value={getCurrentMonthYear()}>{getCurrentMonthYear()} (Current)</option>
              <option value="July 2026">July 2026</option>
              <option value="June 2026">June 2026</option>
              <option value="May 2026">May 2026</option>
              <option value="April 2026">April 2026</option>
              <option value="March 2026">March 2026</option>
              <option value="All">All Months</option>
            </select>
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-600 font-display leading-tight">
            ₹{(isNaN(monthlyCollectedFees) ? 0 : monthlyCollectedFees).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Showing {selectedFeeCollectedMonth === "All" ? "All Dues Paid" : selectedFeeCollectedMonth} ({filteredPaidFeesForMonth.length} paid)</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Outstanding Dues</div>
          <div className="text-2xl md:text-3xl font-black text-rose-500 mt-1 font-display leading-tight">₹{(isNaN(totalOutstanding) ? 0 : totalOutstanding).toLocaleString()}</div>
          <div className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Pending parent reminders</span>
          </div>
        </div>

        <div className="bg-amber-400 border-2 border-amber-300 rounded-3xl p-5 shadow-lg shadow-amber-200/40 text-indigo-950">
          <div className="text-[10px] font-black text-indigo-900/80 uppercase tracking-wider">Monthly Profit / Loss</div>
          <div className="text-2xl md:text-3xl font-black mt-1 font-display leading-tight">
            ₹{(isNaN(netEarnings) ? 0 : netEarnings).toLocaleString()}
          </div>
          <div className="text-[10px] text-indigo-900/80 mt-1.5 flex items-center gap-1 font-bold">
            {netEarnings >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-indigo-900" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-900" />}
            <span>Live Center ledger calculations</span>
          </div>
        </div>
      </div>

      {/* Fee Collections & Billing Health Desk */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4" id="fee-collections-billing-health-desk">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2 font-display">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              Tuition Fee Collection & Billing Metrics Dashboard
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Real-time status of student billing schedules, expected incomes, paid fees, outstanding dues, upcoming schedules, and overdue accounts.</p>
          </div>
          <button
            onClick={handleOpenSchedulerModal}
            className="sm:ml-auto flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-white" />
            <span>Run Monthly Fee Scheduler</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Expected Collections</div>
            <div className="text-lg md:text-xl font-black text-indigo-950 mt-1 font-mono">₹{totalExpectedFees.toLocaleString('en-IN')}</div>
            <p className="text-[9px] text-slate-400 mt-1">Total generated billing schedules.</p>
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
            <div className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Collected Fees
            </div>
            <div className="text-lg md:text-xl font-black text-emerald-600 mt-1 font-mono">₹{totalCollectedFees.toLocaleString('en-IN')}</div>
            <p className="text-[9px] text-emerald-500 mt-1">Settled payments and receipts.</p>
          </div>

          <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-xs">
            <div className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">Outstanding Dues</div>
            <div className="text-lg md:text-xl font-black text-rose-500 mt-1 font-mono">₹{totalOutstandingFees.toLocaleString('en-IN')}</div>
            <p className="text-[9px] text-rose-500 mt-1">Total pending / unpaid dues.</p>
          </div>

          <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-xs">
            <div className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Upcoming Schedules</div>
            <div className="text-lg md:text-xl font-black text-amber-600 mt-1 font-mono">₹{totalUpcomingFees.toLocaleString('en-IN')}</div>
            <p className="text-[9px] text-amber-500 mt-1">Unpaid with due date in future.</p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
              Overdue Accounts
            </div>
            <div className="text-lg md:text-xl font-black text-rose-700 mt-1 font-mono">₹{totalOverdueFees.toLocaleString('en-IN')}</div>
            <p className="text-[9px] text-rose-700 font-semibold mt-1">Unpaid beyond due dates.</p>
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
            { id: "Fees", label: "Fees Collection", icon: CreditCard },
            { id: "FeeSetup", label: "Fee Setup", icon: Settings },
            { id: "NotificationPreferences", label: "Notification Preferences", icon: Bell },
            { id: "Materials", label: "Material Dispatch", icon: Package },
            { id: "OrderMaterials", label: "Order Materials", icon: ShoppingCart },
            { id: "Expenses", label: "Expenses Tracker", icon: Receipt },
            { id: "PnL", label: "Center Ledger", icon: FileSpreadsheet },
            { id: "ConceptWorksheets", label: "Concept Worksheets", icon: BookOpen },
            { id: "CRM", label: "AI Marketing & CRM", icon: Sparkles },
            { id: "ActivityLog", label: "Center Activity Log", icon: ClipboardList },
            { id: "TimingApprovals", label: "Timing Approvals", icon: Clock },
            { id: "Certificates", label: "Digital Certificates", icon: Award },
            { id: "AOS Subscription", label: "AOS Subscription", icon: Landmark },
            ...(activeCenter?.isSuperCenter || activeCenter?.planType === "Multi-Center / Super Center" || (centers && centers.length > 1) ? [{ id: "MultiCenter", label: "👑 Multi-Center Network", icon: Landmark }] : []),
            ...(currentUser?.role === "Super Admin" ? [{ id: "Backups", label: "System Backups", icon: Database }] : [])
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
              <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                <div>
                  <div className="text-sm font-bold text-gray-900 font-display">Enrolled Students list</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Class Teachers manage class roster registrations. Center Admin maintains global editing and records deletion controls below.
                  </div>
                </div>
                <button
                  onClick={() => setShowAddStudent(!showAddStudent)}
                  className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer"
                  id="toggle-add-student"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Onboard Student</span>
                </button>
              </div>

               {showAddStudent && (
                <form onSubmit={handleCreateStudent} className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-4 animate-fade-in">
                  <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 font-display">New Student Registration</div>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Branch / Sub-Branch *</label>
                    <select
                      value={sCenterId || (selectedBranchId !== "ALL" ? selectedBranchId : activeCenterId)}
                      onChange={(e) => setSCenterId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {(centers && centers.length > 0 ? centers : [{ id: activeCenterId, name: "Main Branch" }]).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.id}) {c.parentCenterId ? '• Sub-Branch' : '• Main Branch'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Student Name</label>
                      <input
                        type="text"
                        required
                        value={sName}
                        onChange={(e) => setSName(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                        placeholder="E.g., Dev Makvana"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Parent Name</label>
                      <input
                        type="text"
                        required
                        value={sParent}
                        onChange={(e) => setSParent(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                        placeholder="E.g., Hitendra Makvana"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Parent Mobile</label>
                      <input
                        type="text"
                        required
                        value={sMobile}
                        onChange={(e) => setSMobile(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Assigned Course</label>
                      <select
                        value={sCourseId}
                        onChange={(e) => setSCourseId(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {courses.length > 0 ? (
                          courses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))
                        ) : (
                          <>
                            <option value="c_abacus">Abacus</option>
                            <option value="c_rubik">Rubik's Cube</option>
                            <option value="c_vedic">Vedic Maths</option>
                            <option value="c_chess">Chess</option>
                            <option value="c_coding">Coding</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Age</label>
                      <input
                        type="number"
                        required
                        value={sAge}
                        onChange={(e) => setSAge(Number(e.target.value))}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">School</label>
                      <input
                        type="text"
                        value={sSchool}
                        onChange={(e) => setSSchool(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                        placeholder="School Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Current level</label>
                      <select
                        value={sLevel}
                        onChange={(e) => setSLevel(Number(e.target.value))}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium"
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(lvl => (
                          <option key={lvl} value={lvl}>Level {lvl}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Level Starting Week</label>
                      <select
                        value={sStartingWeek}
                        onChange={(e) => setSStartingWeek(Number(e.target.value))}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(wk => (
                          <option key={wk} value={wk}>Week {wk}</option>
                        ))}
                      </select>
                    </div>
                     <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Batch Schedule</label>
                      <select
                        value={sBatch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSBatch(val);
                          if (val !== "Custom" && val !== "auto") {
                            setCustomBatchVal(val);
                          }
                        }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Keep Blank / To Be Decided --</option>
                        <option value="auto">-- Auto-Assign Batch (Balanced) --</option>
                        {Array.from(new Set(initialTeachers.flatMap(t => t.availableSlots || [])))
                          .filter(b => b && b.trim() !== "")
                          .map(b => (
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
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium mt-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="e.g. Mon 04:00 PM"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Batch Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                      <input
                        type="text"
                        value={sBatchCode}
                        onChange={(e) => setSBatchCode(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. SAT10-L1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Assign Class Teacher</label>
                      <select
                        value={sTeacherId}
                        onChange={(e) => setSTeacherId(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="auto">-- Auto-Assign Teacher (Balance Student Load) --</option>
                        <option value="">-- Unassigned / Manual --</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Student Email Address (Optional)</label>
                      <input
                        type="email"
                        value={sEmail}
                        onChange={(e) => setSEmail(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                        placeholder="E.g., student@geniplus.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Billing Frequency / Cycle</label>
                      <select
                        value={sBillingType}
                        onChange={(e) => setSBillingType(e.target.value as any)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Monthly">Monthly (1 Month)</option>
                        <option value="Level-wise">Level-wise (3 Months / Promotion)</option>
                        <option value="Quarterly">Quarterly (3 Months)</option>
                        <option value="Half-Yearly">Half-Yearly (6 Months)</option>
                        <option value="Yearly">Yearly (12 Months)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Batch Start Date</label>
                      <input
                        type="date"
                        required
                        value={sJoiningDate}
                        onChange={(e) => setSJoiningDate(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStudent(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                    >
                      Onboard Student Row
                    </button>
                  </div>
                </form>
              )}

              {/* Student Filtering Header Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Search className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Search & Filter Students</h4>
                  </div>
                  {(filterStudentName || filterStudentLevel !== "All" || filterStudentTeacher !== "All" || filterStudentBatch !== "All") && (
                    <button
                      onClick={() => {
                        setFilterStudentName("");
                        setFilterStudentLevel("All");
                        setFilterStudentTeacher("All");
                        setFilterStudentBatch("All");
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg border border-rose-100 transition-all flex items-center gap-1"
                    >
                      <span>Clear All Filters</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search by Name */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Name</label>
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={filterStudentName}
                      onChange={(e) => setFilterStudentName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-indigo-500 transition-all shadow-xs"
                    />
                  </div>

                  {/* Filter by Level */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Academic Level</label>
                    <select
                      value={filterStudentLevel}
                      onChange={(e) => setFilterStudentLevel(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-indigo-500 transition-all shadow-xs"
                    >
                      <option value="All">All Levels</option>
                      {uniqueLevels.map(l => (
                        <option key={l} value={String(l)}>Level {l}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Teacher */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Teacher</label>
                    <select
                      value={filterStudentTeacher}
                      onChange={(e) => setFilterStudentTeacher(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-indigo-500 transition-all shadow-xs"
                    >
                      <option value="All">All Teachers</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Batch */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Class Batch</label>
                    <select
                      value={filterStudentBatch}
                      onChange={(e) => setFilterStudentBatch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-indigo-500 transition-all shadow-xs"
                    >
                      <option value="All">All Batches</option>
                      {uniqueBatches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-mono tracking-wider">
                      <th className="p-3">ID & Toggle</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Quick Actions</th>
                      <th className="p-3">Level & Class Time</th>
                      <th className="p-3">Assigned Instructor</th>
                      <th className="p-3">Dues Status</th>
                      <th className="p-3">Parent Contact</th>
                      <th className="p-3 text-right">More</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                          No students found matching your search and filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(s => {
                        const isExpanded = expandedStudentIds.includes(s.id);
                        return (
                          <React.Fragment key={s.id}>
                            <tr className={`hover:bg-slate-50 transition-all ${isExpanded ? "bg-indigo-50/20" : ""}`}>
                              <td className="p-3 font-mono font-semibold">
                                <div className="space-y-1">
                                  <div className="font-mono text-slate-900 font-bold">{s.id}</div>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedStudentIds(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                                    className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-black rounded border border-indigo-200 transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <span>{isExpanded ? "▲ Hide Info" : "▼ Toggle Info"}</span>
                                  </button>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-900 text-[13px] flex items-center gap-1">
                                    <span>{s.studentName}</span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                      s.status === "Inactive" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    }`}>
                                      {s.status || "Active"}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono font-medium">{s.email || "No email assigned"}</div>
                                  <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                    {s.age} yrs • {s.gender || "Gender not set"} • Joined: {s.joiningDate || "N/A"}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => startEditStudent(s)}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewingStudentPerformance(s);
                                      setPerformanceTab("practice");
                                    }}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border border-emerald-200"
                                  >
                                    <TrendingUp className="w-3 h-3" />
                                    <span>Progress</span>
                                  </button>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <div className="text-[11px] font-bold text-slate-900">{s.courseName || "Abacus"}</div>
                                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px] inline-block">Level {s.currentLevel}</span>
                                  <div className="text-[10px] font-medium text-slate-600">{s.batch || "Slot unassigned"}</div>
                                </div>
                              </td>
                              <td className="p-3">
                                <select
                                  value={s.teacherId || ""}
                                  onChange={(e) => handleAssignTeacher(s.id, e.target.value)}
                                  className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-[11px] font-semibold text-slate-800 outline-none hover:border-slate-300 transition-all cursor-pointer"
                                >
                                  <option value="">-- Unassigned --</option>
                                  {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3">
                                {(() => {
                                  const sUnpaidInvoices = fees.filter(f => f.studentId === s.id && f.status === "Unpaid");
                                  const sPendingInvoices = fees.filter(f => f.studentId === s.id && f.status === "Pending Approval");
                                  const sTotalDue = sUnpaidInvoices.reduce((sum, f) => sum + ((Number(f.amount) || 0) - (Number(f.discount) || 0)), 0);
                                  
                                  if (sTotalDue > 0) {
                                    return (
                                      <div className="space-y-1">
                                        <span className="bg-rose-50 border border-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-lg text-[10px] whitespace-nowrap block w-fit">
                                          ₹{sTotalDue} Outstanding
                                        </span>
                                        <span className="text-[9px] font-medium text-rose-500 block">
                                          {sUnpaidInvoices.length} unpaid bill{sUnpaidInvoices.length > 1 ? "s" : ""}
                                        </span>
                                      </div>
                                    );
                                  }
                                  if (sPendingInvoices.length > 0) {
                                    return (
                                      <div className="space-y-1">
                                        <span className="bg-amber-50 border border-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-lg text-[10px] whitespace-nowrap block w-fit">
                                          Pending Verification
                                        </span>
                                        <span className="text-[9px] font-medium text-amber-600 block">
                                          {sPendingInvoices.length} receipt{sPendingInvoices.length > 1 ? "s" : ""} sent
                                        </span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-lg text-[10px] whitespace-nowrap block w-fit">
                                      All Settled ✓
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="p-3">
                                <div className="space-y-0.5">
                                  <div className="text-[11px] font-medium text-slate-700">
                                    {s.parentName || s.fatherName || s.motherName || "Parent N/A"}
                                  </div>
                                  <div className="font-mono text-[10px] text-slate-500">
                                    {s.parentMobile || s.fatherMobile || s.motherMobile || "No Mobile"}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleLocalDeleteStudent(s.id, s.studentName)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 border border-rose-200"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </td>
                            </tr>

                            {/* EXPANDED FULL DETAILS CARD */}
                            {isExpanded && (
                              <tr className="bg-slate-50/80 border-b border-indigo-100">
                                <td colSpan={8} className="p-4">
                                  <div className="bg-white rounded-2xl border-2 border-indigo-100 p-4 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs">
                                          👤 Full Profile Details
                                        </span>
                                        <h4 className="text-sm font-black text-slate-900">{s.studentName} ({s.id})</h4>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => startEditStudent(s)}
                                          className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-700 transition-all cursor-pointer flex items-center gap-1"
                                        >
                                          <Pencil className="w-3 h-3" /> Edit Profile
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedStudentIds(prev => prev.filter(x => x !== s.id))}
                                          className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-200 transition-all cursor-pointer"
                                        >
                                          Close
                                        </button>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                      {/* Column 1: Parent & Emergency */}
                                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
                                        <div className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">
                                          Parent & Emergency Contacts
                                        </div>
                                        {s.fatherName && (
                                          <div>
                                            <span className="text-slate-400 font-bold">Father:</span> {s.fatherName} ({s.fatherMobile || "N/A"})
                                          </div>
                                        )}
                                        {s.motherName && (
                                          <div>
                                            <span className="text-slate-400 font-bold">Mother:</span> {s.motherName} ({s.motherMobile || "N/A"})
                                          </div>
                                        )}
                                        {(!s.fatherName && !s.motherName) && (
                                          <div>
                                            <span className="text-slate-400 font-bold">Primary Parent:</span> {s.parentName || "N/A"} ({s.parentMobile || "N/A"})
                                          </div>
                                        )}
                                        <div className="text-[10px] bg-emerald-50 text-emerald-800 p-1.5 rounded-lg border border-emerald-200 font-bold mt-1">
                                          📲 Notification No: {s.primaryNotificationNumber || s.parentMobile || "N/A"} ({s.primaryContact || "Parent"})
                                        </div>
                                      </div>

                                      {/* Column 2: Address & Location */}
                                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
                                        <div className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">
                                          Location & School Info
                                        </div>
                                        <div><span className="text-slate-400 font-bold">School:</span> {s.school || "Not specified"}</div>
                                        <div><span className="text-slate-400 font-bold">Address:</span> {s.address || "No address provided"}</div>
                                        <div><span className="text-slate-400 font-bold">City / State:</span> {s.city || "N/A"}, {s.state || "N/A"} ({s.pincode || "N/A"})</div>
                                      </div>

                                      {/* Column 3: Academic & Level Details */}
                                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
                                        <div className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">
                                          Course & Class Details
                                        </div>
                                        <div><span className="text-slate-400 font-bold">Course Name:</span> {s.courseName || "Abacus"}</div>
                                        <div><span className="text-slate-400 font-bold">Current Level:</span> Level {s.currentLevel}</div>
                                        <div><span className="text-slate-400 font-bold">Class Time/Batch:</span> {s.batch || "Unassigned"}</div>
                                        <div><span className="text-slate-400 font-bold">Level Start Date:</span> {s.levelStartDate || s.joiningDate || "N/A"}</div>
                                        <div><span className="text-slate-400 font-bold">Fee Plan:</span> {s.feePlan || "Standard Plan"}</div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* EDIT STUDENT MODAL OVERLAY */}
              {editingStudent && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="text-sm font-black text-indigo-950 uppercase tracking-wider font-display">
                        Edit Student Record: {editingStudent.id}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingStudent(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleUpdateStudent} className="space-y-6">
                      {/* Section 1: Student Details */}
                      <div className="space-y-3">
                        <div className="text-[10px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          Student Details
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Student Name</label>
                            <input
                              type="text"
                              required
                              value={editSName}
                              onChange={(e) => setEditSName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date of Birth</label>
                            <input
                              type="date"
                              value={editSDateOfBirth}
                              onChange={(e) => setEditSDateOfBirth(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Age (Auto-calculated)</label>
                            <input
                              type="number"
                              disabled
                              value={editSAge}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gender</label>
                            <select
                              value={editSGender}
                              onChange={(e) => setEditSGender(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                            >
                              <option value="">-- Choose --</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Course</label>
                            <select
                              value={editSCourseId}
                              onChange={(e) => setEditSCourseId(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                            >
                              {courses.length > 0 ? (
                                courses.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))
                              ) : (
                                <>
                                  <option value="c_abacus">Abacus</option>
                                  <option value="c_rubik">Rubik's Cube</option>
                                  <option value="c_vedic">Vedic Maths</option>
                                  <option value="c_chess">Chess</option>
                                  <option value="c_coding">Coding</option>
                                </>
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Curriculum Level</label>
                            <select
                              value={editSLevel}
                              onChange={(e) => setEditSLevel(Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                            >
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(l => <option key={l} value={l}>Level {l}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Level Starting Week</label>
                            <select
                              value={editSStartingWeek}
                              onChange={(e) => setEditSStartingWeek(Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(wk => (
                                <option key={wk} value={wk}>Week {wk}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date Joined</label>
                            <input
                              type="date"
                              value={editSJoiningDate}
                              onChange={(e) => setEditSJoiningDate(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Level Start Date</label>
                            <input
                              type="date"
                              value={editSLevelStartDate}
                              onChange={(e) => setEditSLevelStartDate(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Batch Schedule</label>
                            <input
                              type="text"
                              value={editSBatch}
                              onChange={(e) => setEditSBatch(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Batch Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                            <input
                              type="text"
                              value={editSBatchCode}
                              onChange={(e) => setEditSBatchCode(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                              placeholder="e.g. SAT10-L1"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">School Affiliation</label>
                            <input
                              type="text"
                              value={editSSchool}
                              onChange={(e) => setEditSSchool(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assign Class Teacher</label>
                            <select
                              value={editSTeacherId}
                              onChange={(e) => setEditSTeacherId(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                            >
                              <option value="">-- Unassigned --</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
                            <select
                              value={editSStatus}
                              onChange={(e) => setEditSStatus(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Parent & Primary Contact Details */}
                      <div className="space-y-3">
                        <div className="text-[10px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          Parent & Primary Contact Details
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Father's Name</label>
                            <input
                              type="text"
                              value={editSFatherName}
                              onChange={(e) => setEditSFatherName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Father's Mobile</label>
                            <input
                              type="tel"
                              value={editSFatherMobile}
                              onChange={(e) => setEditSFatherMobile(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mother's Name</label>
                            <input
                              type="text"
                              value={editSMotherName}
                              onChange={(e) => setEditSMotherName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mother's Mobile</label>
                            <input
                              type="tel"
                              value={editSMotherMobile}
                              onChange={(e) => setEditSMotherMobile(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Primary Contact Person</label>
                            <select
                              value={editSPrimaryContact}
                              onChange={(e) => setEditSPrimaryContact(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                            >
                              <option value="">-- Choose Contact --</option>
                              <option value="Father">Father</option>
                              <option value="Mother">Mother</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Primary Notification Number</label>
                            <input
                              type="text"
                              disabled
                              value={editSPrimaryNotificationNumber}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Address Details */}
                      <div className="space-y-3">
                        <div className="text-[10px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          Address Details
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-12">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Address</label>
                            <input
                              type="text"
                              value={editSAddress}
                              onChange={(e) => setEditSAddress(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">City</label>
                            <input
                              type="text"
                              value={editSCity}
                              onChange={(e) => setEditSCity(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">State</label>
                            <input
                              type="text"
                              value={editSState}
                              onChange={(e) => setEditSState(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pincode</label>
                            <input
                              type="text"
                              value={editSPincode}
                              onChange={(e) => setEditSPincode(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Country</label>
                            <input
                              type="text"
                              value={editSCountry}
                              onChange={(e) => setEditSCountry(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                              placeholder="e.g. India, United States"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Login Account & Security */}
                      <div className="space-y-3">
                        <div className="text-[10px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          Login Account & Security
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Student Personal Email (Username)</label>
                            <input
                              type="email"
                              value={editSEmail}
                              onChange={(e) => setEditSEmail(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Reset Security Password <span className="text-[9px] text-indigo-650 font-bold">(leave blank to keep current)</span>
                            </label>
                            <input
                              type="text"
                              value={editSPassword}
                              onChange={(e) => setEditSPassword(e.target.value)}
                              placeholder="Type a new password to reset"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingStudent(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* STUDENT PERFORMANCE ANALYZER MODAL */}
              {viewingStudentPerformance && (() => {
                const s = viewingStudentPerformance;
                const sSubmissions = practiceSubmissions.filter(sub => sub.studentId?.toLowerCase() === s.id?.toLowerCase());
                const sHomeworks = homework.filter(hw => hw.studentId?.toLowerCase() === s.id?.toLowerCase());
                
                const totalStarsComputed = Math.max(sSubmissions.reduce((sum, sub) => sum + (sub.starsEarned || 0), 0), s.stars || 0);
                
                // Calculate behavior metrics
                const totalSubmissionsCount = sSubmissions.length;
                const averageAccuracy = totalSubmissionsCount > 0 
                  ? Math.round(sSubmissions.reduce((sum, sub) => sum + (sub.accuracy || 0), 0) / totalSubmissionsCount)
                  : 0;
                
                const averageTimeTaken = totalSubmissionsCount > 0
                  ? Math.round(sSubmissions.reduce((sum, sub) => sum + (sub.timeTakenSeconds || 0), 0) / totalSubmissionsCount)
                  : 0;

                // Calculate Improvement Trend (compare last 3 with previous ones)
                let improvementText = "In early training phase 📈";
                if (totalSubmissionsCount >= 4) {
                  const sortedSubs = [...sSubmissions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  const recentAccuracy = sortedSubs.slice(0, 3).reduce((sum, sub) => sum + (sub.accuracy || 0), 0) / 3;
                  const olderAccuracy = sortedSubs.slice(3).reduce((sum, sub) => sum + (sub.accuracy || 0), 0) / (totalSubmissionsCount - 3);
                  const diff = recentAccuracy - olderAccuracy;
                  if (diff > 5) {
                    improvementText = `Significant improvement! Accuracy increased by +${Math.round(diff)}% recently ⚡`;
                  } else if (diff >= -5) {
                    improvementText = "Steady performance. Consistent speed and accuracy! ✓";
                  } else {
                    improvementText = "Requires some attention. Accuracy dropped slightly in recent attempts 🔍";
                  }
                }

                // Consistency / Practice Behavior description
                let behaviorText = "Incomplete baseline data.";
                if (totalSubmissionsCount > 0) {
                  if (totalSubmissionsCount >= 10) {
                    behaviorText = "Highly consistent! Submits multiple drills per week. Excellent focus. 🌟";
                  } else if (totalSubmissionsCount >= 5) {
                    behaviorText = "Moderate consistency. Regular practice, maintains standard daily habits. 👍";
                  } else {
                    behaviorText = "Needs encouragement. Submitting fewer speed drills. Motivate parent to support daily habit. 💬";
                  }
                }

                return (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-4 relative animate-fade-in">
                      {/* Header */}
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                        <div>
                          <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">
                            Student Performance Portfolio
                          </span>
                          <h4 className="text-base font-black text-slate-900 font-display mt-0.5">
                            {s.studentName}
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            Student ID: <span className="font-mono font-semibold">{s.id}</span> • Course: <span className="font-semibold">{s.courseName || "Abacus"}</span> • Current Level: <span className="font-semibold">Level {s.currentLevel}</span> • Batch: <span className="font-mono">{s.batch}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingStudentPerformance(null)}
                          className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 hover:bg-slate-50 rounded"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* LEFT COLUMN: STATS SUMMARY & BADGES */}
                        <div className="lg:col-span-1 space-y-4">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                            <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider border-b border-slate-200/60 pb-1 font-mono">
                              Honor Dashboard
                            </h5>
                            
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div className="bg-white p-2 rounded-lg border border-slate-200/50">
                                <div className="text-xl font-black text-indigo-600 font-mono">
                                  ★ {totalStarsComputed}
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold">Total Stars</div>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-slate-200/50">
                                <div className="text-xl font-black text-emerald-600 font-mono">
                                  {totalSubmissionsCount}
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold">Drills Done</div>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                              {s.isStudentOfWeek && !s.studentOfWeekReason?.includes("0 stars") && (
                                <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg p-2 text-left">
                                  <div className="text-[10px] font-extrabold flex items-center gap-1">
                                    ⭐ STUDENT OF THE WEEK
                                  </div>
                                  <p className="text-[9px] text-indigo-600 mt-0.5 leading-tight font-medium">
                                    {s.studentOfWeekReason || "Awarded for outstanding practice scores this week."}
                                  </p>
                                </div>
                              )}
                              {s.isStudentOfMonth && !s.studentOfMonthReason?.includes("0 stars") && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2 text-left">
                                  <div className="text-[10px] font-extrabold flex items-center gap-1">
                                    👑 STUDENT OF THE MONTH
                                  </div>
                                  <p className="text-[9px] text-amber-700 mt-0.5 leading-tight font-medium">
                                    {s.studentOfMonthReason || "Awarded for outstanding speed practice this month."}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                            <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider border-b border-slate-200/60 pb-1 font-mono">
                              Badges Secured ({s.badges?.length || 0})
                            </h5>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {s.badges && s.badges.length > 0 ? (
                                s.badges.map((badge, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 bg-white border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                                    {badge}
                                  </span>
                                ))
                              ) : (
                                <p className="text-[10px] text-slate-400 italic font-medium">No badges awarded yet.</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: DETAIL TABS & TABLES */}
                        <div className="lg:col-span-3 space-y-4">
                          {/* Tabs Nav */}
                          <div className="flex border-b border-slate-200 gap-2 font-display font-medium">
                            <button
                              type="button"
                              onClick={() => setPerformanceTab("practice")}
                              className={`pb-2 px-3 text-xs font-black transition-all ${
                                performanceTab === "practice"
                                  ? "border-b-2 border-indigo-600 text-indigo-700"
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              Practice Submissions ({totalSubmissionsCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setPerformanceTab("homework")}
                              className={`pb-2 px-3 text-xs font-black transition-all ${
                                performanceTab === "homework"
                                  ? "border-b-2 border-indigo-600 text-indigo-700"
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              Assigned Homework ({sHomeworks.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setPerformanceTab("behavior")}
                              className={`pb-2 px-3 text-xs font-black transition-all ${
                                performanceTab === "behavior"
                                  ? "border-b-2 border-indigo-600 text-indigo-700"
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              Improvement & Behavior 📈
                            </button>
                          </div>

                          {/* Tab Content: Practice */}
                          {performanceTab === "practice" && (
                            <div className="space-y-2">
                              {sSubmissions.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                                  <p className="text-xs font-bold text-slate-500">No practice drills submitted yet.</p>
                                  <p className="text-[10px] text-slate-400 mt-1">Encourage the student to log in and start custom abacus or mental theory speed practices!</p>
                                </div>
                              ) : (
                                <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-96 overflow-y-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono font-bold uppercase tracking-wider">
                                        <th className="p-2.5">Date</th>
                                        <th className="p-2.5">Type/Mode</th>
                                        <th className="p-2.5">Speed Config</th>
                                        <th className="p-2.5 text-center">Row Settings</th>
                                        <th className="p-2.5 text-center">Accuracy</th>
                                        <th className="p-2.5 text-center">Time Taken</th>
                                        <th className="p-2.5 text-right text-indigo-600">Stars</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                      {[...sSubmissions].reverse().map((sub, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                          <td className="p-2.5 font-mono">{sub.date}</td>
                                          <td className="p-2.5 font-semibold text-slate-800">{sub.assignmentTitle || "Self Speed Practice"}</td>
                                          <td className="p-2.5">
                                            {sub.type ? (
                                              <span className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                                                {sub.type}
                                              </span>
                                            ) : (
                                              <span className="text-slate-400">-</span>
                                            )}
                                          </td>
                                          <td className="p-2.5 text-center font-mono font-bold">
                                            {sub.totalSums || sub.sumsCount || 10} sums
                                          </td>
                                          <td className="p-2.5 text-center">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                              (sub.accuracy || 0) >= 90
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : (sub.accuracy || 0) >= 60
                                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                : "bg-rose-50 text-rose-700 border border-rose-200"
                                            }`}>
                                              {sub.accuracy || 0}%
                                            </span>
                                          </td>
                                          <td className="p-2.5 text-center font-mono text-slate-500">
                                            {sub.timeTakenSeconds ? `${sub.timeTakenSeconds}s` : "N/A"}
                                          </td>
                                          <td className="p-2.5 text-right font-mono font-black text-indigo-600">
                                            ★ {sub.starsEarned || 0}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab Content: Homework */}
                          {performanceTab === "homework" && (
                            <div className="space-y-2">
                              {sHomeworks.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                                  <p className="text-xs font-bold text-slate-500">No textbook/text homeworks assigned yet.</p>
                                  <p className="text-[10px] text-slate-400 mt-1">Assign custom daily workbook practices to see and verify submissions here!</p>
                                </div>
                              ) : (
                                <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-96 overflow-y-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono font-bold uppercase tracking-wider">
                                        <th className="p-2.5">Task Description</th>
                                        <th className="p-2.5 font-mono">Assigned</th>
                                        <th className="p-2.5 font-mono">Completed</th>
                                        <th className="p-2.5">Status</th>
                                        <th className="p-2.5 text-center">Score</th>
                                        <th className="p-2.5 text-right">Teacher Feedback</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                      {[...sHomeworks].reverse().map((hw) => (
                                        <tr key={hw.id} className="hover:bg-slate-50">
                                          <td className="p-2.5">
                                            <div className="font-semibold text-slate-800">{hw.task}</div>
                                            <div className="text-[9px] text-slate-400">Week: {hw.week}</div>
                                          </td>
                                          <td className="p-2.5 font-mono text-[11px] text-slate-500">{hw.assignedDate}</td>
                                          <td className="p-2.5 font-mono text-[11px] text-slate-500">{hw.submissionDate || "Pending"}</td>
                                          <td className="p-2.5">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                              hw.status === "Approved"
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                : hw.status === "Submitted"
                                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                                : "bg-rose-50 text-rose-700 border border-rose-100"
                                            }`}>
                                              {hw.status}
                                            </span>
                                          </td>
                                          <td className="p-2.5 text-center font-bold text-slate-800">{hw.score || "-"}</td>
                                          <td className="p-2.5 text-right text-slate-500 text-[11px] max-w-xs truncate" title={hw.feedback}>
                                            {hw.feedback || <span className="text-slate-300 italic">No comments</span>}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab Content: Behavior & Trends */}
                          {performanceTab === "behavior" && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-2">
                                  <h6 className="text-[11px] font-black text-indigo-950 uppercase tracking-wider font-mono">
                                    Practice Behavior Metrics
                                  </h6>
                                  <div className="space-y-2 pt-1 text-xs font-medium">
                                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                      <span className="text-slate-500">Average Accuracy:</span>
                                      <span className="font-bold text-slate-800">{averageAccuracy}%</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                      <span className="text-slate-500">Average Time Per Drill:</span>
                                      <span className="font-bold text-slate-800">{averageTimeTaken ? `${averageTimeTaken}s` : "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between pb-0.5">
                                      <span className="text-slate-500">Consistent Habit Level:</span>
                                      <span className="font-bold text-slate-800">
                                        {totalSubmissionsCount >= 10 ? "Gold Star 🌟" : totalSubmissionsCount >= 5 ? "Active Silver 👍" : "Bronze Encouragement 🎖️"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-2">
                                  <h6 className="text-[11px] font-black text-emerald-950 uppercase tracking-wider font-mono">
                                    Improvement Analysis
                                  </h6>
                                  <div className="space-y-2 pt-1 text-xs leading-relaxed font-medium">
                                    <div>
                                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Trend State:</div>
                                      <p className="font-semibold text-slate-800 mt-0.5">{improvementText}</p>
                                    </div>
                                    <div>
                                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Daily consistency note:</div>
                                      <p className="text-slate-700 mt-0.5">{behaviorText}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-[10px] text-slate-400 italic">
                                *Metrics are auto-compiled in real-time from speed simulator calculations and daily textbook verification logs. Encourage the student to do 5 minutes of practice daily!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-end pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setViewingStudentPerformance(null)}
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-xs"
                        >
                          Close Portfolio
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TEACHERS SUB-TAB */}
          {subTab === "Teachers" && (
            <div className="space-y-4">
              {/* Center Admin Works As Teacher Settings */}
              <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-100/80 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Multi-Role Settings</div>
                  <h4 className="text-xs font-black text-slate-900 font-display">Center Admin as Classroom Instructor</h4>
                  <p className="text-[11px] text-slate-500">
                    Enable teaching privileges for the Center Admin account (<strong>{activeCenterOwner}</strong>) to manage batches, schedule class lists, track attendance, and assign practice sheets.
                  </p>
                </div>
                <div className="flex items-center shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer select-none gap-3 bg-white border border-indigo-200/60 px-4 py-2.5 rounded-xl shadow-xs hover:border-indigo-300 transition-all">
                    <input
                      type="checkbox"
                      checked={isAlsoWorksAsTeacher}
                      onChange={handleToggleAlsoWorksAsTeacher}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">Also Works As Teacher</span>
                  </label>
                </div>
              </div>

              {/* Instructor Availability & Time Slots Visualizer */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                <div>
                  <div className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Timetable & Schedule Hub</div>
                  <h4 className="text-sm font-black text-slate-900 font-display">Instructor Availability & Clean Time Slots</h4>
                  <p className="text-[11px] text-slate-500">
                    Select any instructor below to view their active availability slots, manage their schedule, and see which students are assigned to each time slot.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Select Teacher Column */}
                  <div className="md:col-span-1 space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Instructor</label>
                      <select
                        value={adminSelectedTeacherId}
                        onChange={(e) => {
                          setAdminSelectedTeacherId(e.target.value);
                          setAdminNewSlotInput("");
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Choose Instructor --</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.role || "Instructor"})
                          </option>
                        ))}
                      </select>
                    </div>

                    {adminSelectedTeacherId && (() => {
                      const selTeacher = teachers.find(t => t.id === adminSelectedTeacherId);
                      if (!selTeacher) return null;
                      return (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const val = adminNewSlotInput.trim();
                            if (!val) return;
                            
                            const currentSlots = selTeacher.availableSlots || [];
                            if (currentSlots.includes(val)) {
                              alert("This time slot is already added!");
                              return;
                            }
                            const newSlots = [...currentSlots, val];
                            try {
                              const res = await fetch("/api/erp/update-teacher-slots", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  teacherId: selTeacher.id,
                                  availableSlots: newSlots
                                })
                              });
                              const data = await res.json();
                              if (data.success) {
                                setAdminNewSlotInput("");
                                if (onRefreshData) await onRefreshData();
                                alert("Slot added successfully on behalf of " + selTeacher.name);
                              }
                            } catch (err: any) {
                              alert("Error: " + err.message);
                            }
                          }}
                          className="space-y-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-4"
                        >
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quick Add Slot</div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Saturday 10:00 AM"
                              value={adminNewSlotInput}
                              onChange={(e) => setAdminNewSlotInput(e.target.value)}
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="submit"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
                            >
                              Add
                            </button>
                          </div>
                        </form>
                      );
                    })()}
                  </div>

                  {/* Slots & Students Column */}
                  <div className="md:col-span-2 space-y-4">
                    {!adminSelectedTeacherId ? (
                      <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-150 rounded-2xl bg-slate-50/30 text-slate-400">
                        <Clock className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
                        <span className="text-xs font-semibold">Select an instructor on the left to visualize schedules</span>
                      </div>
                    ) : (() => {
                      const selTeacher = teachers.find(t => t.id === adminSelectedTeacherId);
                      if (!selTeacher) return null;
                      
                      const slots = selTeacher.availableSlots || [];
                      // Get students assigned to this teacher
                      const teacherStudents = students.filter(s => s.teacherId === selTeacher.id);
                      
                      return (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-2xl">
                            <span className="text-xs font-extrabold text-indigo-950 font-display">Schedule for {selTeacher.name}</span>
                            <span className="text-[10px] font-mono bg-indigo-200 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">
                              {teacherStudents.length} Active Students
                            </span>
                          </div>

                          {slots.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl text-xs text-slate-400">
                              No active available slots defined for this instructor yet.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                              {slots.map((slot, index) => {
                                const matchedStudents = teacherStudents.filter(s => s.batch?.toLowerCase().trim() === slot.toLowerCase().trim());
                                return (
                                  <div key={index} className="border border-slate-100 bg-slate-50/20 hover:bg-slate-50/50 rounded-2xl p-4 transition-colors">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                                      <span className="font-extrabold text-slate-800 text-xs">{slot}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-semibold text-slate-500">
                                          {matchedStudents.length} {matchedStudents.length === 1 ? "Student" : "Students"}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (!confirm(`Remove slot "${slot}" on behalf of ${selTeacher.name}?`)) return;
                                            const newSlots = slots.filter(s => s !== slot);
                                            try {
                                              const res = await fetch("/api/erp/update-teacher-slots", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                  teacherId: selTeacher.id,
                                                  availableSlots: newSlots
                                                })
                                              });
                                              const data = await res.json();
                                              if (data.success) {
                                                if (onRefreshData) await onRefreshData();
                                                alert("Slot removed!");
                                              }
                                            } catch (err: any) {
                                              alert("Error: " + err.message);
                                            }
                                          }}
                                          className="text-rose-600 hover:text-rose-800 font-black text-[10px]"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>

                                    {matchedStudents.length === 0 ? (
                                      <div className="text-[10px] text-slate-400 italic">
                                        ✓ This slot is clean/empty! Selectable by new students.
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {matchedStudents.map(student => (
                                          <div key={student.id} className="bg-white border border-slate-150 rounded-xl p-2 flex items-center justify-between text-[11px]">
                                            <div className="space-y-0.5">
                                              <span className="font-extrabold text-slate-800">{student.studentName}</span>
                                              <span className="block text-[10px] text-slate-500">Level {student.currentLevel} • Age {student.age}</span>
                                            </div>
                                            <span className="text-[9px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                                              L{student.currentLevel}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Unassigned or mismatched students */}
                          {(() => {
                            const slotsLower = slots.map(s => s.toLowerCase().trim());
                            const unassigned = teacherStudents.filter(s => !slotsLower.includes(s.batch?.toLowerCase().trim() || ""));
                            if (unassigned.length > 0) {
                              return (
                                <div className="border border-amber-100 bg-amber-50/20 rounded-2xl p-4 mt-3">
                                  <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-2">
                                    Other Assigned Students (Mismatched Batch / General Timings)
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {unassigned.map(student => (
                                      <div key={student.id} className="bg-white border border-amber-150 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                                        <div>
                                          <span className="font-extrabold text-amber-950 block">{student.studentName}</span>
                                          <span className="text-[10px] text-amber-700 font-medium">Batch: {student.batch || "Not Set"}</span>
                                        </div>
                                        <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded">
                                          L{student.currentLevel}
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
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Staff Email Notification Control Banner */}
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-black text-purple-950 uppercase tracking-wider">Staff Email Notification Control</span>
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                      OFF by Default
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-purple-900/80 max-w-2xl">
                    Email notifications for staff/teachers are manually controlled. Turn them ON/OFF individually using the table toggle below, or bulk manage staff notification status.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleAllStaffNotifications(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Turn ON Email Notifications for All Staff</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllStaffNotifications(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <BellOff className="w-3.5 h-3.5" />
                    <span>Turn OFF for All</span>
                  </button>
                </div>
              </div>

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
                        <option value="Manager + Teacher">Manager + Teacher</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Monthly Salary (₹)</label>
                      <input type="number" min="0" required value={tMonthlySalary || ""} onChange={(e) => setTMonthlySalary(Number(e.target.value))} placeholder="e.g. 15000" className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Teacher Digital Signature (For Certificates)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tSignature}
                          onChange={(e) => setTSignature(e.target.value)}
                          placeholder="Upload image or paste URL"
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                        />
                        <label className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 cursor-pointer shrink-0">
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setTSignature(ev.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {tSignature && (
                        <div className="mt-1.5 p-1.5 bg-white border border-slate-200 rounded-lg inline-flex items-center gap-2">
                          <img src={tSignature} alt="Sig Preview" className="h-6 object-contain" />
                          <span className="text-[10px] font-bold text-emerald-600">✓ Ready</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email Notification Toggle for New Staff */}
                  <div className="bg-purple-50/80 border border-purple-200 rounded-lg p-3 space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tEmailNotif}
                        onChange={(e) => setTEmailNotif(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-purple-950">
                        Enable Email Notifications for this Staff Member
                      </span>
                    </label>
                    <p className="text-[10px] font-medium text-purple-800/80 pl-6">
                      {tEmailNotif ? "🟢 Active — Staff will receive practice submissions, homework alerts, & daily digests." : "⚪ Disabled (Default) — Staff will NOT receive email alerts unless turned ON by Centre Admin."}
                    </p>
                  </div>

                  {/* Multi-Center Branch Selection for Teachers */}
                  {centers && centers.length > 1 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                      <label className="block text-[11px] font-bold text-gray-700">
                        Assigned Teaching Branches / Centers (Multi-Center Teaching)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {centers.map(c => {
                          const checked = tCenterIds.length === 0 ? c.id === activeCenterId : tCenterIds.includes(c.id);
                          return (
                            <label key={c.id} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const current = tCenterIds.length === 0 ? [activeCenterId] : tCenterIds;
                                  if (e.target.checked) {
                                    setTCenterIds([...new Set([...current, c.id])]);
                                  } else {
                                    setTCenterIds(current.filter(id => id !== c.id));
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
                      <th className="p-3">CRM Access</th>
                      <th className="p-3">Email Alerts</th>
                      <th className="p-3">Signature</th>
                      <th className="p-3">Monthly Salary</th>
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
                          {t.email?.toLowerCase() === activeCenterEmail?.toLowerCase() ? (
                            <div className="flex flex-col gap-1.5 py-1">
                              <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold w-fit">
                                ✓ Center Admin
                              </span>
                              <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold w-fit">
                                ✓ Teacher
                              </span>
                            </div>
                          ) : (
                            <select
                              value={t.role || ""}
                              onChange={(e) => handleAssignTeacherRole(t.id, e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg py-1 px-1.5 text-[11px] font-semibold text-slate-800 outline-none hover:border-indigo-300 transition-colors cursor-pointer"
                            >
                              <option value="Senior Abacus Trainer">Senior Abacus Trainer</option>
                              <option value="Junior Teacher">Junior Teacher</option>
                              <option value="Head Coach">Head Coach</option>
                              <option value="Marketing & Sales Staff">Marketing & Sales Staff</option>
                              <option value="Teacher & Marketing Representative">Teacher & Marketing Representative</option>
                              <option value="Manager + Teacher">Manager + Teacher</option>
                            </select>
                          )}
                        </td>
                        <td className="p-3">
                          <label className="relative inline-flex items-center cursor-pointer gap-1.5 select-none">
                            <input
                              type="checkbox"
                              checked={!!t.permitLeadAccess}
                              onChange={async (e) => {
                                const val = e.target.checked;
                                try {
                                  const res = await fetch("/api/erp/update-teacher", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      teacherId: t.id,
                                      permitLeadAccess: val
                                    })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    if (onRefreshData) await onRefreshData();
                                  } else {
                                    alert("Error: " + (data.error || "Failed to update permission"));
                                  }
                                } catch (err: any) {
                                  alert("Error updating CRM permission: " + err.message);
                                }
                              }}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer"
                            />
                            <span className={`text-[10px] font-bold ${t.permitLeadAccess ? "text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200" : "text-slate-400"}`}>
                              {t.permitLeadAccess ? "Allowed" : "Off"}
                            </span>
                          </label>
                        </td>
                        <td className="p-3">
                          <label className="relative inline-flex items-center cursor-pointer gap-1.5 select-none">
                            <input
                              type="checkbox"
                              checked={!!t.emailNotificationsEnabled}
                              onChange={async (e) => {
                                const val = e.target.checked;
                                try {
                                  const res = await fetch("/api/erp/update-teacher", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      teacherId: t.id,
                                      emailNotificationsEnabled: val
                                    })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    setTeachers(prev => prev.map(item => item.id === t.id ? { ...item, emailNotificationsEnabled: val } : item));
                                    if (onRefreshData) await onRefreshData();
                                  } else {
                                    alert("Error: " + (data.error || "Failed to update email notification setting"));
                                  }
                                } catch (err: any) {
                                  alert("Error updating email notification setting: " + err.message);
                                }
                              }}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer"
                            />
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${t.emailNotificationsEnabled ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-slate-400 bg-slate-100 border-slate-200"}`}>
                              {t.emailNotificationsEnabled ? "🟢 Active" : "⚪ Off"}
                            </span>
                          </label>
                        </td>
                        <td className="p-3">
                          {t.signatureUrl || t.signature ? (
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg w-fit">
                              <img src={t.signatureUrl || t.signature} alt="Sig" className="h-5 max-w-[60px] object-contain" />
                              <span className="text-[10px] text-emerald-600 font-bold">✓ Saved</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditTeacherClick(t)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg"
                            >
                              + Add Sig
                            </button>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          ₹{(t.monthlySalary || 0).toLocaleString()}
                        </td>
                        <td className="p-3 font-mono text-gray-400">{t.joiningDate}</td>
                        <td className="p-3"><span className="text-emerald-700 font-semibold">{t.status}</span></td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {t.email?.toLowerCase() === activeCenterEmail?.toLowerCase() ? (
                            <button
                              onClick={() => handleEditTeacherClick(t)}
                              className="text-indigo-600 hover:text-indigo-850 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit Details</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditTeacherClick(t)}
                                className="text-indigo-600 hover:text-indigo-850 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteTeacher(t.id, t.name)}
                                className="text-rose-600 hover:text-rose-850 hover:bg-rose-50 p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                                title="Remove Teacher"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* EDIT TEACHER MODAL */}
              {editingTeacher && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 space-y-4 relative animate-fade-in">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 font-display">Edit Staff Profile</h4>
                        <p className="text-[10px] text-slate-500">ID: {editingTeacher.id}</p>
                      </div>
                      <button 
                        onClick={() => setEditingTeacher(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                      >
                        &times;
                      </button>
                    </div>
                    
                    <form onSubmit={handleUpdateTeacherSubmit} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          required 
                          value={editTName} 
                          onChange={(e) => setEditTName(e.target.value)} 
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Email Address</label>
                        <input 
                          type="email" 
                          required 
                          value={editTEmail} 
                          onChange={(e) => setEditTEmail(e.target.value)} 
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Mobile Number</label>
                        <input 
                          type="text" 
                          required 
                          value={editTMobile} 
                          onChange={(e) => setEditTMobile(e.target.value)} 
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Designated Role</label>
                        <select 
                          value={editTRole} 
                          onChange={(e) => setEditTRole(e.target.value)} 
                          className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium"
                        >
                          <option value="Senior Abacus Trainer">Senior Abacus Trainer</option>
                          <option value="Junior Teacher">Junior Teacher</option>
                          <option value="Head Coach">Head Coach</option>
                          <option value="Marketing & Sales Staff">Marketing & Sales Staff</option>
                          <option value="Teacher & Marketing Representative">Teacher & Marketing Representative</option>
                          <option value="Manager + Teacher">Manager + Teacher</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Monthly Salary (₹)</label>
                        <input 
                          type="number" 
                          min="0" 
                          required 
                          value={editTSalary || ""} 
                          onChange={(e) => setEditTSalary(Number(e.target.value))} 
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" 
                        />
                      </div>

                      {/* Staff Email Notification Toggle */}
                      <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3 space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={editTEmailNotif}
                            onChange={(e) => setEditTEmailNotif(e.target.checked)}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-purple-950">
                            Email Notifications Enabled
                          </span>
                        </label>
                        <p className="text-[10px] font-medium text-purple-800/80 pl-6">
                          {editTEmailNotif ? "🟢 Active — Receives daily practice digest, student practice alerts & homework completions." : "⚪ Off (Default) — Staff will NOT receive email alerts."}
                        </p>
                      </div>

                      {/* Teacher Signature Photo for Certificates */}
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-800 flex items-center justify-between">
                          <span>Teacher Signature Image (For Certificates)</span>
                          <span className="text-[10px] text-indigo-600 font-extrabold">Digital Certificates</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTSignature}
                            onChange={(e) => setEditTSignature(e.target.value)}
                            placeholder="https://... or upload photo"
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none"
                          />
                          <label className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 cursor-pointer shrink-0">
                            Upload Photo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => setEditTSignature(ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        {editTSignature ? (
                          <div className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2">
                              <img src={editTSignature} alt="Signature Preview" className="h-8 max-w-[130px] object-contain bg-slate-50 p-0.5 rounded border border-slate-200" />
                              <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Signature Saved
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditTSignature("")}
                              className="text-[10px] text-rose-600 font-bold hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic">
                            No signature photo uploaded yet. Upload transparent PNG signature for student completion certificates.
                          </p>
                        )}
                      </div>

                      {/* Multi-Center Branch Selection for Editing Teacher */}
                      {centers && centers.length > 1 && (
                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 space-y-2">
                          <label className="block text-[11px] font-bold text-slate-800">
                            Assigned Teaching Centers / Branches (Multi-Center View)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {centers.map(c => {
                              const checked = editTCenterIds.includes(c.id);
                              return (
                                <label key={c.id} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditTCenterIds(prev => [...prev, c.id]);
                                      } else {
                                        setEditTCenterIds(prev => prev.filter(id => id !== c.id));
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
                      
                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button 
                          type="button" 
                          onClick={() => setEditingTeacher(null)} 
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
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

              {/* Dynamic Pending Fee Assignment Notifications */}
              {(() => {
                const studentsWithoutFees = students.filter(s => {
                  const hasFees = fees.some(f => f.studentId === s.id);
                  return s.status === "Active" && !hasFees;
                });

                if (studentsWithoutFees.length === 0) return null;

                return (
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                      </span>
                      <h5 className="text-xs font-black text-amber-950 uppercase tracking-wider font-display">
                        📢 Actions Required: Pending Fee Assignments ({studentsWithoutFees.length})
                      </h5>
                    </div>
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      The following newly registered students have not been assigned any fees or tuition plan yet. Please discuss with the parent and manually generate their invoice using the form below.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {studentsWithoutFees.map(s => {
                        const stCourse = courses.find(c => c.id === s.courseId) || { name: s.courseName || "Abacus" };
                        return (
                          <div key={s.id} className="bg-white border border-amber-200/40 rounded-xl p-3 flex flex-col justify-between gap-2.5 shadow-2xs">
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{s.studentName}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                Course: <span className="font-semibold text-slate-700">{stCourse.name}</span> • Contact: <span className="font-mono text-slate-700">{s.parentMobile || "N/A"}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleStudentSelect(s.id);
                                // Smooth scroll to the form
                                const formEl = document.querySelector("form");
                                if (formEl) {
                                  formEl.scrollIntoView({ behavior: "smooth" });
                                }
                              }}
                              className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Assign Fees / Plan</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

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
                  <form onSubmit={handleCreateStudentInvoice} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Select Student</label>
                          {selectedStudentSearch && (
                            <button type="button" onClick={() => setSelectedStudentSearch("")} className="text-[9px] text-indigo-600 font-bold hover:underline">Clear search</button>
                          )}
                        </div>
                        <div className="relative mb-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Filter student name/mobile/level..."
                            value={selectedStudentSearch}
                            onChange={(e) => setSelectedStudentSearch(e.target.value)}
                            className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <select
                          required
                          value={selectedStudent}
                          onChange={(e) => handleStudentSelect(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                        >
                          <option value="">-- Choose Student ({
                            students.filter(s => {
                              if (!selectedStudentSearch.trim()) return true;
                              const q = selectedStudentSearch.toLowerCase().trim();
                              return s.studentName.toLowerCase().includes(q) ||
                                (s.parentMobile || "").includes(q) ||
                                (s.mobile || "").includes(q) ||
                                `l${s.currentLevel}`.includes(q) ||
                                (s.batchCode || "").toLowerCase().includes(q) ||
                                (s.batch || "").toLowerCase().includes(q);
                            }).length
                          } found) --</option>
                          {students
                            .filter(s => {
                              if (!selectedStudentSearch.trim()) return true;
                              const q = selectedStudentSearch.toLowerCase().trim();
                              return s.studentName.toLowerCase().includes(q) ||
                                (s.parentMobile || "").includes(q) ||
                                (s.mobile || "").includes(q) ||
                                `l${s.currentLevel}`.includes(q) ||
                                (s.batchCode || "").toLowerCase().includes(q) ||
                                (s.batch || "").toLowerCase().includes(q);
                            })
                            .map(s => (
                              <option key={s.id} value={s.id}>
                                {s.studentName} (L{s.currentLevel} • {s.batchCode || s.batch || "No Batch"} • {s.parentMobile || "No Mobile"})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Course / Program</label>
                        <select
                          value={invCourseId}
                          onChange={(e) => handleInvoiceCourseChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                        >
                          {courses.length > 0 ? (
                            courses.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.duration || "3 Months"})</option>
                            ))
                          ) : (
                            <>
                              <option value="c_abacus">Abacus (3 Months)</option>
                              <option value="c_rubik">Rubik's Cube (1 Month)</option>
                              <option value="c_vedic">Vedic Maths (3 Months)</option>
                              <option value="c_chess">Chess (3 Months)</option>
                              <option value="c_coding">Coding (3 Months)</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                      <div className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>Select Fee Components (Check to Include & Customize)</span>
                        <span className="text-[10px] text-indigo-600 font-bold font-mono">100% Manual Override Mode</span>
                      </div>
                      
                      <div className="space-y-2.5">
                        {/* 1. Tuition Fee */}
                        <div className="flex flex-col gap-2.5 bg-white p-2.5 border border-slate-100 rounded-lg shadow-2xs">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="chkTuition"
                              checked={includeTuition}
                              onChange={(e) => setIncludeTuition(e.target.checked)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 cursor-pointer"
                            />
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label htmlFor="chkTuition" className="block text-[9px] font-bold text-slate-400 uppercase">Tuition Fee Title</label>
                                <input
                                  type="text"
                                  disabled={!includeTuition}
                                  value={tuitionDesc}
                                  onChange={(e) => setTuitionDesc(e.target.value)}
                                  className="w-full bg-slate-50/50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none disabled:opacity-40"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                                <input
                                  type="number"
                                  disabled={!includeTuition}
                                  value={tuitionAmount}
                                  onChange={(e) => setTuitionAmount(Number(e.target.value) || 0)}
                                  className="w-full bg-slate-50/50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-900 font-mono disabled:opacity-40"
                                />
                              </div>
                            </div>
                          </div>
                          {includeTuition && (
                            <div className="ml-7 flex flex-col gap-2 bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl w-full max-w-md">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="chkMonthlyTuition"
                                  checked={isMonthlyTuition}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setIsMonthlyTuition(checked);
                                    populateCourseFees(invCourseId, checked);
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                                />
                                <label htmlFor="chkMonthlyTuition" className="text-[10px] font-bold text-indigo-950 cursor-pointer flex flex-wrap gap-1 items-center select-none">
                                  <span>🗓️ Convert Tuition to Monthly Installments (Split standard Level Fee into 3 Months of ₹{(() => {
                                    const currentCourse = courses.find(c => c.id === invCourseId) || [
                                      { id: "c_abacus", name: "Abacus", fee: 3600 },
                                      { id: "c_rubik", name: "Rubik's Cube", fee: 1500 },
                                      { id: "c_vedic", name: "Vedic Maths", fee: 3600 },
                                      { id: "c_chess", name: "Chess", fee: 3000 },
                                      { id: "c_coding", name: "Coding", fee: 6000 }
                                    ].find(d => d.id === invCourseId);
                                    const fee = currentCourse ? Number(currentCourse.fee) || 3600 : 3600;
                                    return Math.round(fee / 3);
                                  })()}/mo)</span>
                                </label>
                              </div>

                              <div className="border-t border-indigo-100/60 pt-2.5 mt-1 flex flex-col gap-1">
                                <label className="block text-[9px] font-extrabold text-indigo-700 uppercase">
                                  Fee Billing Frequency / Assignment Cycle
                                </label>
                                <select
                                  value={customInvoiceBillingFreq}
                                  onChange={(e) => setCustomInvoiceBillingFreq(e.target.value)}
                                  className="bg-white border border-indigo-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none w-full max-w-xs shadow-xs"
                                >
                                  <option value="Monthly">Monthly Fees (1 Month cycle)</option>
                                  <option value="Level-wise">Level-wise (3 Months / Promotion)</option>
                                  <option value="Quarterly">Quarterly Fees (3 Months cycle)</option>
                                  <option value="Half-Yearly">Half-Yearly Fees (6 Months cycle)</option>
                                  <option value="Yearly">Yearly Fees (12 Months cycle)</option>
                                </select>
                                <p className="text-[8px] text-slate-500">The system automatically assigns invoices & notifications on the 1st of the month based on this cycle.</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. Registration Fee */}
                        <div className="flex items-center gap-3 bg-white p-2.5 border border-slate-100 rounded-lg shadow-2xs">
                          <input
                            type="checkbox"
                            id="chkRegistration"
                            checked={includeRegistration}
                            onChange={(e) => setIncludeRegistration(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 cursor-pointer"
                          />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="chkRegistration" className="block text-[9px] font-bold text-slate-400 uppercase">Registration Fee Title</label>
                              <input
                                type="text"
                                disabled={!includeRegistration}
                                value={registrationDesc}
                                onChange={(e) => setRegistrationDesc(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none disabled:opacity-40"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                              <input
                                type="number"
                                disabled={!includeRegistration}
                                value={registrationAmount}
                                onChange={(e) => setRegistrationAmount(Number(e.target.value) || 0)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-900 font-mono disabled:opacity-40"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 3. Exam Fee */}
                        <div className="flex items-center gap-3 bg-white p-2.5 border border-slate-100 rounded-lg shadow-2xs">
                          <input
                            type="checkbox"
                            id="chkExam"
                            checked={includeExam}
                            onChange={(e) => setIncludeExam(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 cursor-pointer"
                          />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="chkExam" className="block text-[9px] font-bold text-slate-400 uppercase">Exam Fee Title</label>
                              <input
                                type="text"
                                disabled={!includeExam}
                                value={examDesc}
                                onChange={(e) => setExamDesc(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none disabled:opacity-40"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                              <input
                                type="number"
                                disabled={!includeExam}
                                value={examAmount}
                                onChange={(e) => setExamAmount(Number(e.target.value) || 0)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-900 font-mono disabled:opacity-40"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 4. Other/Miscellaneous Fee */}
                        <div className="flex items-center gap-3 bg-white p-2.5 border border-slate-100 rounded-lg shadow-2xs">
                          <input
                            type="checkbox"
                            id="chkOther"
                            checked={includeOther}
                            onChange={(e) => setIncludeOther(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 cursor-pointer"
                          />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="chkOther" className="block text-[9px] font-bold text-slate-400 uppercase">Other Fee Title</label>
                              <input
                                type="text"
                                disabled={!includeOther}
                                placeholder="e.g. Activity or Materials"
                                value={otherDesc}
                                onChange={(e) => setOtherDesc(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none disabled:opacity-40"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                              <input
                                type="number"
                                disabled={!includeOther}
                                value={otherAmount}
                                onChange={(e) => setOtherAmount(Number(e.target.value) || 0)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-900 font-mono disabled:opacity-40"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Billing Month / Title <span className="text-[9px] font-normal text-indigo-600">(Auto-set from current date)</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={`e.g. ${getCurrentMonthYear()}`}
                          value={feeMonthInput}
                          onChange={(e) => setFeeMonthInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Student Discount (₹)</label>
                        <input
                          type="number"
                          min="0"
                          max={getSelectedInvoiceTotal()}
                          value={studentDiscountInput}
                          onChange={(e) => setStudentDiscountInput(Number(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {[
                            { label: "0%", pct: 0 },
                            { label: "5% Off", pct: 0.05 },
                            { label: "10% Off", pct: 0.10 },
                            { label: "15% Off", pct: 0.15 },
                            { label: "20% Off", pct: 0.20 },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setStudentDiscountInput(Math.round(getSelectedInvoiceTotal() * preset.pct))}
                              className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold border border-slate-300 cursor-pointer transition-colors"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Live Invoice Preview Alert */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex justify-between items-center">
                      <div className="text-[11px] text-indigo-950 font-medium">
                        <div>Base Price: <span className="font-bold font-mono">₹{getSelectedInvoiceTotal()}</span></div>
                        <div>Applied Discount: <span className="font-semibold font-mono text-rose-600">-₹{studentDiscountInput}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-bold text-indigo-500 uppercase">Net Student Invoice Bill</div>
                        <div className="text-lg font-black text-indigo-950 font-mono">
                          ₹{Math.max(0, getSelectedInvoiceTotal() - studentDiscountInput)}
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

                    {(!smtpHost || !smtpUser) && (
                      <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-[10px] text-amber-900 flex items-start gap-2 shadow-2xs">
                        <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-amber-950 block">⚠️ SMTP Configuration Required for Email Reminders</span>
                          Invoices, receipts, and payment reminders are delivering via <strong>In-App & WhatsApp</strong>. Configure SMTP in <strong>Email Settings</strong> to send direct emails to student/parent registered email addresses.
                        </div>
                      </div>
                    )}

                    {/* Quick Search & Level Filter for Outstanding Dues */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <div className="relative flex-1">
                        <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search dues by student name/mobile..."
                          value={duesSearchQuery}
                          onChange={(e) => setDuesSearchQuery(e.target.value)}
                          className="w-full pl-7 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                      <select
                        value={duesLevelFilter}
                        onChange={(e) => setDuesLevelFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      >
                        <option value="All">All Levels</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(lvl => (
                          <option key={lvl} value={String(lvl)}>L{lvl}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-3 divide-y divide-slate-150 max-h-64 overflow-y-auto pr-2 space-y-2">
                      {students.filter(s => {
                        const unpaidInvoices = fees.filter(f => f.studentId === s.id && f.status === "Unpaid");
                        const totalDue = unpaidInvoices.reduce((sum, f) => sum + ((Number(f.amount) || 0) - (Number(f.discount) || 0)), 0);
                        if (totalDue === 0) return false;

                        if (duesLevelFilter !== "All" && String(s.currentLevel) !== duesLevelFilter) return false;

                        if (duesSearchQuery.trim()) {
                          const q = duesSearchQuery.toLowerCase().trim();
                          const nameMatch = s.studentName.toLowerCase().includes(q);
                          const mobileMatch = (s.parentMobile || "").includes(q);
                          const batchMatch = (s.batchCode || "").toLowerCase().includes(q) || (s.batch || "").toLowerCase().includes(q);
                          if (!nameMatch && !mobileMatch && !batchMatch) return false;
                        }

                        return true;
                      }).map(s => {
                        const unpaidInvoices = fees.filter(f => f.studentId === s.id && f.status === "Unpaid");
                        const totalDue = unpaidInvoices.reduce((sum, f) => sum + ((Number(f.amount) || 0) - (Number(f.discount) || 0)), 0);

                        return (
                          <div key={s.id} className="pt-2 pb-2.5 flex justify-between items-center gap-3 text-xs">
                            {/* Left Side: Student Name, Level/Bill Info, Action Buttons */}
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 truncate text-xs">{s.studentName}</span>
                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                  ({unpaidInvoices.length} bill{unpaidInvoices.length > 1 ? "s" : ""} • L{s.currentLevel})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const parentMobileClean = s.parentMobile.replace(/\s+/g, "").replace(/-/g, "").replace(/\+/g, "");
                                    const unpaidInvs = fees.filter(f => f.studentId === s.id && f.status === "Unpaid");
                                    let invoiceDetailsText = "";
                                    if (unpaidInvs.length > 0) {
                                      invoiceDetailsText = unpaidInvs.map((inv, idx) => {
                                        const discount = inv.discount || 0;
                                        const basePrice = inv.amount;
                                        const netPrice = basePrice - discount;
                                        const dueDate = `10th of ${inv.month || "Current Month"}`;
                                        return `[Invoice #${idx + 1}: No ${inv.id}, Due ${dueDate}, Base Total: Rs ${basePrice}, Discount: Rs ${discount}, Net Pending: Rs ${netPrice}]`;
                                      }).join(" | ");
                                    } else {
                                      invoiceDetailsText = `[Invoice: No INV-${s.id.slice(-4)}-PEND, Due: 10th of current month, Total: Rs ${totalDue}, Paid: Rs 0, Pending: Rs ${totalDue}]`;
                                    }
                                    const messageText = `Dear Parent, this is ${activeCenterName}. Consolidated outstanding invoice(s) for ${s.studentName}: ${invoiceDetailsText}. Kindly make payment via UPI or use your student dashboard to scan the QR code. Please ignore if already paid. Thank you!`;
                                    const whatsappUrl = `https://api.whatsapp.com/send?phone=${parentMobileClean}&text=${encodeURIComponent(messageText)}`;
                                    window.open(whatsappUrl, "_blank");
                                  }}
                                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md py-0.5 px-2 transition-all shadow-3xs"
                                  title="WhatsApp Reminder"
                                >
                                  <MessageSquare className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>WhatsApp</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={notificationSending === s.id}
                                  onClick={() => handleSendInAppReminder(s.id, s.studentName, totalDue, s.currentLevel)}
                                  className="text-[10px] text-indigo-700 hover:text-indigo-800 disabled:opacity-50 font-bold flex items-center gap-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-md py-0.5 px-2 transition-all shadow-3xs"
                                  title="Send In-App Msg"
                                >
                                  <Send className="w-3 h-3 text-indigo-600 shrink-0" />
                                  <span>{notificationSending === s.id ? "..." : "In-App"}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={notificationSending === s.id}
                                  onClick={() => handleSendEmailReminder(s.id, s.studentName, totalDue, s.currentLevel)}
                                  className="text-[10px] text-purple-700 hover:text-purple-800 disabled:opacity-50 font-bold flex items-center gap-1 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-md py-0.5 px-2 transition-all shadow-3xs"
                                  title="Send Email Reminder"
                                >
                                  <Mail className="w-3 h-3 text-purple-600 shrink-0" />
                                  <span>{notificationSending === s.id ? "..." : "Email"}</span>
                                </button>
                              </div>
                            </div>
                            {/* Right Side: Total Dues Badge */}
                            <div className="shrink-0 pl-1 text-right">
                              <span className="inline-block text-xs font-black text-rose-600 font-mono tracking-tight bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg shadow-3xs">
                                ₹{totalDue.toLocaleString('en-IN')}
                              </span>
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
                      ₹{fees.filter(f => f.status === "Unpaid").reduce((sum, f) => sum + ((Number(f.amount) || 0) - (Number(f.discount) || 0)), 0).toLocaleString()}
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
                              <div className="text-sm font-black text-slate-950 mt-1 font-mono">₹{(Number(pFee.amount) || 0) - (Number(pFee.discount) || 0)}</div>
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
              <div className="space-y-3">
                {(() => {
                  const uniqueFeeMonths = Array.from(new Set(fees.map(f => f.month).filter(Boolean)));
                  const filteredFees = fees.filter(f => {
                    if (feeStatusFilter !== "All" && f.status !== feeStatusFilter) return false;
                    if (feeMonthFilter !== "All" && f.month !== feeMonthFilter) return false;
                    const sObj = students.find(s => s.id === f.studentId);
                    if (feeLevelFilter !== "All") {
                      if (!sObj || String(sObj.currentLevel) !== feeLevelFilter) return false;
                    }
                    if (feeSearchQuery.trim()) {
                      const q = feeSearchQuery.toLowerCase().trim();
                      const sNameMatch = sObj ? sObj.studentName.toLowerCase().includes(q) : false;
                      const parentMobileMatch = sObj ? (sObj.parentMobile || "").includes(q) : false;
                      const idMatch = f.id.toLowerCase().includes(q);
                      const monthMatch = (f.month || "").toLowerCase().includes(q);
                      const typeMatch = (f.feeType || "").toLowerCase().includes(q);
                      const statusMatch = (f.status || "").toLowerCase().includes(q);
                      const batchMatch = sObj ? ((sObj.batchCode || "").toLowerCase().includes(q) || (sObj.batch || "").toLowerCase().includes(q)) : false;
                      if (!sNameMatch && !parentMobileMatch && !idMatch && !monthMatch && !typeMatch && !statusMatch && !batchMatch) {
                        return false;
                      }
                    }
                    return true;
                  });

                  return (
                    <>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-black text-slate-800 uppercase tracking-wider font-display flex items-center gap-2">
                              <Filter className="w-4 h-4 text-indigo-600" />
                              <span>School Invoice Records & Ledger</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Showing <strong className="text-slate-800">{filteredFees.length}</strong> of <strong className="text-slate-800">{fees.length}</strong> fee invoice records
                            </p>
                          </div>

                          {(feeSearchQuery || feeStatusFilter !== "All" || feeMonthFilter !== "All" || feeLevelFilter !== "All") && (
                            <button
                              type="button"
                              onClick={() => {
                                setFeeSearchQuery("");
                                setFeeStatusFilter("All");
                                setFeeMonthFilter("All");
                                setFeeLevelFilter("All");
                              }}
                              className="self-start sm:self-auto text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
                            >
                              <X className="w-3 h-3" />
                              <span>Clear Fee Filters</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {/* 1. Search Bar */}
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Search student, fee ID, mobile..."
                              value={feeSearchQuery}
                              onChange={(e) => setFeeSearchQuery(e.target.value)}
                              className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          {/* 2. Status Filter */}
                          <div>
                            <select
                              value={feeStatusFilter}
                              onChange={(e) => setFeeStatusFilter(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="All">All Statuses (Paid / Unpaid / Pending)</option>
                              <option value="Unpaid">Unpaid / Dues Pending</option>
                              <option value="Paid">Paid / Settled</option>
                              <option value="Pending Approval">Pending Parent Review</option>
                            </select>
                          </div>

                          {/* 3. Month Filter */}
                          <div>
                            <select
                              value={feeMonthFilter}
                              onChange={(e) => setFeeMonthFilter(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="All">All Billing Months</option>
                              {uniqueFeeMonths.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>

                          {/* 4. Level Filter */}
                          <div>
                            <select
                              value={feeLevelFilter}
                              onChange={(e) => setFeeLevelFilter(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="All">All Student Levels</option>
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(lvl => (
                                <option key={lvl} value={String(lvl)}>Level {lvl}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

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
                            {filteredFees.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="p-8 text-center text-slate-400">
                                  No fee records match your search / filter criteria.
                                </td>
                              </tr>
                            ) : (
                              filteredFees.map(f => {
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
                                    <td className="p-3 font-mono text-rose-500 font-semibold">-₹{f.discount || 0}</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">₹{(Number(f.amount) || 0) - (Number(f.discount) || 0)}</td>
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
                                    <td className="p-3">
                                      {f.paidDate ? (
                                        <div className="space-y-0.5">
                                          <div className="font-mono text-xs font-semibold text-slate-700">{f.paidDate}</div>
                                          {(f.paymentMethod || f.referenceNumber) && (
                                            <div className="text-[10px] text-slate-400 font-medium flex flex-wrap gap-1 items-center">
                                              {f.paymentMethod && <span className="bg-slate-100 text-slate-600 px-1 py-0.25 rounded text-[9px] font-mono font-bold uppercase">{f.paymentMethod}</span>}
                                              {f.referenceNumber && <span className="font-mono font-bold text-indigo-600">#{f.referenceNumber}</span>}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">—</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        {/* Edit Invoice details */}
                                        <button
                                          onClick={() => handleStartEditInvoice(f)}
                                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                          title="Edit Invoice"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Mark Unpaid (if currently Paid) */}
                                        {f.status === "Paid" && (
                                          <button
                                            onClick={() => handleLocalMarkUnpaid(f.id)}
                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                            title="Mark Unpaid"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                          </button>
                                        )}

                                        {/* Delete Invoice button */}
                                        <button
                                          onClick={() => handleDeleteFeeInvoice(f.id)}
                                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                          title="Delete Invoice Entry"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* SELECT PAYMENT DATE MODAL */}
              {payingFeeId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                  <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 relative overflow-hidden">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="text-sm font-black text-indigo-950 uppercase tracking-wider font-display flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        Record Fee Payment
                      </h4>
                      <button
                        type="button"
                        onClick={() => setPayingFeeId(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(() => {
                        const targetFee = fees.find(f => f.id === payingFeeId);
                        const sObj = targetFee ? students.find(s => s.id === targetFee.studentId) : null;
                        return (
                          <div className="space-y-4">
                            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">Invoice ID:</span>
                                <strong className="text-slate-700 font-mono font-bold">{payingFeeId}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">Student:</span>
                                <strong className="text-slate-700 font-bold">{sObj ? sObj.studentName : (targetFee?.studentId || "—")}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">Item Category:</span>
                                <strong className="text-slate-700 font-bold">{targetFee?.feeType || "Level Tuition Fee"} ({targetFee?.month})</strong>
                              </div>
                              <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5 font-bold">
                                <span className="text-slate-600">Net Amount:</span>
                                <strong className="text-indigo-600 font-mono text-sm">₹{targetFee ? ((Number(targetFee.amount) || 0) - (Number(targetFee.discount) || 0)) : 0}</strong>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Select Payment Date
                              </label>
                              <input
                                type="date"
                                required
                                value={customPaidDate}
                                onChange={(e) => setCustomPaidDate(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Payment Method
                              </label>
                              <select
                                value={payMethod}
                                onChange={(e) => setPayMethod(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
                              >
                                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                                <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                                <option value="Cash">Cash Payment</option>
                                <option value="Card">Card Payment</option>
                                <option value="Other">Other Method</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <span>Next Billing Cycle / Term Selection</span>
                                <span className="text-indigo-600 font-bold">*</span>
                              </label>
                              <select
                                value={nextFeeCycle}
                                onChange={(e) => setNextFeeCycle(e.target.value)}
                                className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
                              >
                                <option value="Monthly">Monthly Fees (1 Month cycle)</option>
                                <option value="Level-wise">Level-wise (3 Months / Promotion)</option>
                                <option value="Quarterly">Quarterly Fees (3 Months cycle)</option>
                                <option value="Half-Yearly">Half-Yearly Fees (6 Months cycle)</option>
                                <option value="Yearly">Yearly Fees (12 Months cycle)</option>
                              </select>
                              <p className="text-[9px] text-slate-400">Sets the billing schedule. Due notices will assign on the 1st of the month based on this cycle selection.</p>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Transaction ID / Reference Number
                              </label>
                              <input
                                type="text"
                                placeholder="E.g., UPI Ref, Txn ID, Bank Receipt No."
                                value={payReference}
                                onChange={(e) => setPayReference(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
                              />
                            </div>

                            <div className="flex gap-2.5 pt-2">
                              <button
                                type="button"
                                onClick={() => setPayingFeeId(null)}
                                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all active:scale-95"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleConfirmFeePayment}
                                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all active:scale-95 shadow-sm shadow-indigo-200"
                              >
                                Save & Mark Paid
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* EDIT INVOICE MODAL */}
              {editingInvoice && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                  <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 relative overflow-hidden">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="text-sm font-black text-indigo-950 uppercase tracking-wider font-display flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-indigo-600" />
                        Edit Fee Invoice
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingInvoice(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditInvoice} className="space-y-4">
                      <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Invoice ID:</span>
                          <strong className="text-slate-700 font-mono font-bold">{editingInvoice.id}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Fee Type:</span>
                          <strong className="text-slate-700 font-bold">{editingInvoice.feeType || "Tuition Fee"}</strong>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editInvoiceAmount}
                          onChange={(e) => setEditInvoiceAmount(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Discount (₹)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editInvoiceDiscount}
                          onChange={(e) => setEditInvoiceDiscount(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Bill Cycle / Month
                        </label>
                        <input
                          type="text"
                          required
                          value={editInvoiceMonth}
                          onChange={(e) => setEditInvoiceMonth(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Payment Status
                        </label>
                        <select
                          value={editInvoiceStatus}
                          onChange={(e) => setEditInvoiceStatus(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Paid">Paid</option>
                          <option value="Pending Approval">Pending Approval</option>
                        </select>
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingInvoice(null)}
                          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all active:scale-95"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all active:scale-95 shadow-sm shadow-indigo-200"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FEE STRUCTURE SETUP SUB-TAB */}
          {subTab === "FeeSetup" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="text-base font-black text-slate-900 font-display">Configure Customized School Fees Structure</h4>
                <p className="text-xs text-gray-500 mt-1">Set up custom tuition rates, level-based fees, registration amounts, and add extra-curricular activities or competitions.</p>
              </div>

              {/* BRANDING SETTINGS SECTION */}
              <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-indigo-500/10 rounded-3xl border border-indigo-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
                    Academy Custom Logo & Name Branding
                  </h5>
                </div>

                <p className="text-xs text-slate-650 leading-relaxed font-medium">
                  Customize the look and name of your academy portal. Your students and instructors will see your custom name and logo on their respective dashboard screens and login interfaces.
                </p>

                <form onSubmit={handleSaveBrandingSettings} className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Custom Academy / School Name</label>
                        <input
                          type="text"
                          required
                          value={academyName}
                          onChange={(e) => setAcademyName(e.target.value)}
                          placeholder="e.g. My Abacus Genius East"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Official Academy Logo</label>
                        <div className="flex items-center gap-4">
                          {academyLogo ? (
                            <div className="relative group border border-slate-200 p-2 rounded-xl bg-white">
                              <img 
                                src={academyLogo} 
                                alt="Academy Logo Preview" 
                                className="h-12 object-contain max-w-[120px]" 
                                referrerPolicy="no-referrer"
                              />
                              <button
                                type="button"
                                onClick={() => setAcademyLogo("")}
                                className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="h-12 w-28 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                              No Logo Uploaded
                            </div>
                          )}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              id="academy-logo-file"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="academy-logo-file"
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-[11px] font-extrabold px-3.5 py-2 rounded-xl cursor-pointer active:scale-95 transition-all inline-block"
                            >
                              Upload Brand Logo
                            </label>
                            <p className="text-[9px] text-slate-400 mt-1">Recommended: Horizontal PNG logo (ratio ~ 3:1)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={brandingSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:bg-indigo-400"
                    >
                      {brandingSaving ? "Saving Branding..." : "Save Academy Branding & Name"}
                    </button>
                  </div>
                </form>
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
                      Sometimes your Venture/Academy hosts specific Abacus competitions, level championships, or summer camps. Create custom fees below to bill students for these events.
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

              {/* LEVEL PROMOTION ELIGIBILITY SETTINGS */}
              <div className="bg-slate-50 border-2 border-slate-150 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h5 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
                    Level Promotion Settings
                  </h5>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">Exam Fee Clearance Policy</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Choose whether a student must clear their level's Exam Fee before they are permitted to be promoted to the next Abacus Level.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-3xs shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleExamFeeMandatory(false)}
                      className={`text-[11px] font-extrabold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                        !examFeeMandatory 
                          ? "bg-amber-100 text-amber-800 border border-amber-200" 
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Allow promotion with pending exam fee
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleExamFeeMandatory(true)}
                      className={`text-[11px] font-extrabold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                        examFeeMandatory 
                          ? "bg-rose-100 text-rose-800 border border-rose-200" 
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Exam fee mandatory before promotion
                    </button>
                  </div>
                </div>
              </div>

              {/* MONTHLY & YEARLY PAYMENT PLANS MANAGER */}
              <div className="bg-white border-2 border-slate-150 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      <span>Monthly & Annual Student Payment Plans</span>
                    </h5>
                    <p className="text-xs text-slate-500 mt-1">
                      Configure student subscription tiers with monthly fees and discounted annual plans. These plans appear on enquiry forms and the public landing page.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSavePaymentPlan} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h6 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Create / Add New Payment Plan</h6>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Plan Title / Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Master Scholar Pro"
                        value={planNameInput}
                        onChange={(e) => setPlanNameInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Course Scope</label>
                      <input
                        type="text"
                        placeholder="e.g. Abacus Level 1 - 8"
                        value={planCourseInput}
                        onChange={(e) => setPlanCourseInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Discount Tag</label>
                      <input
                        type="text"
                        placeholder="e.g. Save 20%"
                        value={planSavingsTag}
                        onChange={(e) => setPlanSavingsTag(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Monthly Billing Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={planMonthlyPrice}
                        onChange={(e) => setPlanMonthlyPrice(e.target.value !== "" ? Number(e.target.value) : "")}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Yearly / Annual Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={planYearlyPrice}
                        onChange={(e) => setPlanYearlyPrice(e.target.value !== "" ? Number(e.target.value) : "")}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-900 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={planPopular}
                          onChange={(e) => setPlanPopular(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-800">Badge as "Most Popular" Plan</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Included Features (1 feature per line)</label>
                    <textarea
                      rows={3}
                      value={planFeatures}
                      onChange={(e) => setPlanFeatures(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500"
                      placeholder="2 Live Classes / Week&#10;Free Abacus Physical Kit&#10;Unlimited Practice Worksheets"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={planSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {planSaving ? "Saving Plan..." : "Add Payment Plan"}
                    </button>
                  </div>
                </form>

                {/* Display Payment Plans Cards */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">Active Payment Plans ({centerPlans.length})</h6>
                    
                    {/* Monthly vs Yearly Switch preview */}
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPlanBillingCycle("monthly")}
                        className={`text-[10px] font-extrabold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          planBillingCycle === "monthly" ? "bg-white text-indigo-900 shadow-xs" : "text-slate-500"
                        }`}
                      >
                        Monthly Rates
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanBillingCycle("yearly")}
                        className={`text-[10px] font-extrabold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          planBillingCycle === "yearly" ? "bg-white text-indigo-900 shadow-xs" : "text-slate-500"
                        }`}
                      >
                        Yearly Rates (Discounted)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {centerPlans.map((plan: any) => (
                      <div
                        key={plan.id}
                        className={`bg-white border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs relative ${
                          plan.popular ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-200"
                        }`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-3 right-4 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                            Most Popular
                          </span>
                        )}

                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900">{plan.name}</h4>
                              <p className="text-[10px] text-slate-500 font-medium">{plan.course}</p>
                            </div>
                            {plan.savingsTag && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                {plan.savingsTag}
                              </span>
                            )}
                          </div>

                          <div className="mt-3">
                            {planBillingCycle === "monthly" ? (
                              <div>
                                <span className="text-2xl font-black text-slate-900 font-mono">₹{plan.monthlyPrice}</span>
                                <span className="text-xs text-slate-500 font-bold"> / month</span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-2xl font-black text-indigo-950 font-mono">₹{plan.yearlyPrice}</span>
                                <span className="text-xs text-indigo-600 font-bold"> / year</span>
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  (₹{Math.round(plan.yearlyPrice / 12)}/mo billed annually)
                                </span>
                              </div>
                            )}
                          </div>

                          <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                            {(plan.features || []).map((feat: string, fIdx: number) => (
                              <li key={fIdx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeletePaymentPlan(plan.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                            title="Delete Payment Plan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ==================== PENDING LEVEL PROMOTIONS ==================== */}
              <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-indigo-50 pb-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h5 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">
                        Pending Level Promotion Requests
                      </h5>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Review learning promotions nominated by trainers. Exam fees must be cleared before approval.
                      </p>
                    </div>
                  </div>
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                    {(promotionRequests || []).filter(r => r.status === "Pending").length} Pending
                  </span>
                </div>

                {/* Main promotions table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5">Student Name</th>
                        <th className="py-2.5">Nominated By</th>
                        <th className="py-2.5">Level Progression</th>
                        <th className="py-2.5">Exam Fee Cleared?</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(promotionRequests || []).filter(r => r.status === "Pending").map((req) => {
                        // Check if they have unpaid exam fees
                        const unpaidExamFee = (initialFees || []).some(f => 
                          f.studentId === req.studentId && 
                          f.feeType === "Exam Fee" && 
                          (f.status === "Unpaid" || f.status === "Pending Approval")
                        );
                        return (
                          <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 font-extrabold text-slate-900">{req.studentName}</td>
                            <td className="py-3 font-medium text-slate-500">{req.teacherName}</td>
                            <td className="py-3">
                              <span className="font-extrabold text-slate-500">Level {req.currentLevel}</span>
                              <ChevronRight className="w-3.5 h-3.5 inline mx-1 text-slate-400" />
                              <span className="bg-emerald-50 text-emerald-800 font-black px-2 py-0.5 rounded-lg">Level {req.targetLevel}</span>
                            </td>
                            <td className="py-3">
                              {unpaidExamFee ? (
                                <span className="bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3" />
                                  Uncleared Exam Fees
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1">
                                  ✓ Cleared / Paid
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPromoReq(req);
                                  // Auto populate tuition fee input with current level fee setup
                                  setPromoTuitionFee(levelFeeInput);
                                  setPromoMaterialFee(0);
                                  setPromoDiscount(0);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] px-3.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                              >
                                Review & Bill
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectPromotion(req.id)}
                                className="border border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold text-[11px] px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {(promotionRequests || []).filter(r => r.status === "Pending").length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                            No pending level learning promotion requests awaiting approval.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Promotion billing drawer */}
                {selectedPromoReq && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-5 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-indigo-100/65 pb-2">
                      <h6 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Billing Configuration: {selectedPromoReq.studentName} Promotion (Level {selectedPromoReq.targetLevel})
                      </h6>
                      <button
                        type="button"
                        onClick={() => setSelectedPromoReq(null)}
                        className="text-slate-400 hover:text-slate-650 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleApprovePromotion} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
                      <div>
                        <label className="block font-bold text-slate-650 mb-1">Billing Frequency</label>
                        <select
                          value={promoBillingFreq}
                          onChange={(e) => setPromoBillingFreq(e.target.value)}
                          className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                          <option value="Monthly">Monthly</option>
                          <option value="Level-wise">Level-wise (per Level duration)</option>
                          <option value="Half-yearly">Half-yearly (6 Months)</option>
                          <option value="Yearly">Yearly (12 Months)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-650 mb-1">Tuition Fee (₹)</label>
                        <input
                          type="number"
                          required
                          value={promoTuitionFee}
                          onChange={(e) => setPromoTuitionFee(Number(e.target.value))}
                          className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-650 mb-1">Material / Book Fee (Optional)</label>
                        <input
                          type="number"
                          value={promoMaterialFee}
                          onChange={(e) => setPromoMaterialFee(Number(e.target.value))}
                          className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none"
                          placeholder="₹0"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-650 mb-1">Apply Discount Preset</label>
                        <div className="flex gap-1">
                          {[0, 10, 20, 30].map(pct => (
                            <button
                              type="button"
                              key={pct}
                              onClick={() => setPromoDiscount(pct)}
                              className={`px-2 py-2 text-[10px] font-black rounded-lg transition-colors ${
                                promoDiscount === pct ? "bg-indigo-600 text-white" : "bg-white text-indigo-700 border border-indigo-200"
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-4 flex items-center justify-between bg-white border border-indigo-100 p-3 rounded-2xl">
                        <div className="text-[11px] font-bold text-indigo-950">
                          Total Promotion Bill: 
                          <span className="text-xs font-black text-indigo-600 font-mono ml-1.5">
                            ₹{Math.round(promoTuitionFee * (1 - promoDiscount / 100))} (Tuition) + ₹{promoMaterialFee} (Material) = ₹{Math.round(promoTuitionFee * (1 - promoDiscount / 100)) + promoMaterialFee}
                          </span>
                        </div>
                        <button
                          type="submit"
                          disabled={promoSubmitting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                        >
                          {promoSubmitting ? "Generating..." : "Approve & Generate Invoice"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* ==================== DYNAMIC COURSE OFFERINGS MANAGER ==================== */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
                      Configure Course/Program Offerings
                    </h5>
                    <p className="text-[10px] text-gray-500 mt-0.5">Add and customize center programs with individual durations and level structures.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Add Course Form */}
                  <form onSubmit={handleCreateCourse} className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-200/50 pb-1 flex items-center gap-1">
                      <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                      Add New Course Offering
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Course / Program Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vedic Maths Level 1"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-indigo-950 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Course Duration</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 3 Months"
                          value={newCourseDuration}
                          onChange={(e) => setNewCourseDuration(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-indigo-950 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Registration Fee (₹)</label>
                        <input
                          type="number"
                          required
                          value={newCourseRegFee}
                          onChange={(e) => setNewCourseRegFee(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-indigo-950 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Course Fee (₹)</label>
                        <input
                          type="number"
                          required
                          value={newCourseFee}
                          onChange={(e) => setNewCourseFee(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-indigo-950 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Exam Fee (₹)</label>
                        <input
                          type="number"
                          required
                          value={newCourseExamFee}
                          onChange={(e) => setNewCourseExamFee(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-indigo-950 outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={courseAdding}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold p-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                      >
                        {courseAdding ? "Adding Course..." : "Add Course Offering"}
                      </button>
                    </div>
                  </form>

                  {/* Course List */}
                  <div className="lg:col-span-2 space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {courses.map((course) => (
                      <div key={course.id} className="bg-white border border-slate-150 rounded-xl p-3.5 flex justify-between items-center text-xs shadow-3xs hover:shadow-2xs transition-all">
                        <div className="space-y-1">
                          <div className="font-extrabold text-slate-900 flex items-center gap-2">
                            <span>{course.name}</span>
                            <span className="bg-slate-100 text-slate-600 font-mono text-[9px] px-1.5 py-0.5 rounded-lg font-bold">{course.duration}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium flex flex-wrap gap-x-3 gap-y-1">
                            <span>Reg Fee: <strong className="text-slate-800">₹{course.registrationFee || 0}</strong></span>
                            <span>Course Fee: <strong className="text-slate-800">₹{course.fee || 0}</strong></span>
                            <span>Exam Fee: <strong className="text-slate-800">₹{course.examFee || 0}</strong></span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-lg hover:bg-rose-50"
                          title="Delete Course Offering"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {courses.length === 0 && (
                      <div className="text-center py-12 text-slate-400 italic text-xs">
                        No customized course structures added yet. Default academy programs are active.
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Official UPI ID (optional)</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="academy@okhdfcbank"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Wire details (optional)</label>
                        <textarea
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

              {/* CENTER EMAIL NOTIFICATIONS & SENDER CONFIGURATION */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
                        Email Notifications & Sender Configuration
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        Configure sender email ID and select registered recipient email for automated notifications (new leads, fee receipts, student updates).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailLogs(!showEmailLogs);
                        if (!showEmailLogs) fetchEmailLogs();
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>{showEmailLogs ? "Hide Sent Email Logs" : "View Sent Email Logs"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendTestEmail("general")}
                      disabled={testEmailLoading}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-extrabold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-indigo-200"
                    >
                      {testEmailLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send Test Email</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveEmailSettings} className="space-y-5">
                  {/* Master Switch */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-black text-slate-800">Master Email Notifications Switch</span>
                      <span className="block text-[10px] text-slate-500">Enable or pause all outgoing email dispatches for this academy</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotificationsEnabled}
                        onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Notification Recipient Email */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Registered Notification Email (Recipient) <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          required
                          value={notificationEmail}
                          onChange={(e) => setNotificationEmail(e.target.value)}
                          placeholder="e.g. rajesh.east@geniplus.com"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentCenter = (centers || []).find(c => c.id === activeCenterId);
                            if (currentCenter?.email) {
                              setNotificationEmail(currentCenter.email);
                            } else if (currentUser?.email) {
                              setNotificationEmail(currentUser.email);
                            }
                          }}
                          className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-xl whitespace-nowrap transition-colors"
                          title="Click to fill with registered account login email"
                        >
                          Use Registered Email
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        This is the registered email ID where center admin will receive real-time alerts for new leads, fee receipts, and updates.
                      </p>
                    </div>

                    {/* Sender Email Address */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Sender Email Address (Outbound) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="notifications@geniplus.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400">
                        The email ID displayed as the sender on outgoing automated system notifications and fee receipts.
                      </p>
                    </div>
                  </div>

                  {/* Individual Event Preferences Toggles */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <span className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Select Email Notification Events
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* New Lead Alert */}
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/30 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={emailNotifyNewLead}
                          onChange={(e) => setEmailNotifyNewLead(e.target.checked)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            📩 New Lead / Demo Inquiry Alerts
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            Send email notification when a new student lead is registered on public form or CRM desk.
                          </span>
                        </div>
                      </label>

                      {/* Fee Receipt Alert */}
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/30 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={emailNotifyFeeReceipt}
                          onChange={(e) => setEmailNotifyFeeReceipt(e.target.checked)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            🧾 Fee Receipt & Payment Alerts
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            Send email notification when tuition fee payment is recorded or receipt is issued.
                          </span>
                        </div>
                      </label>

                      {/* Attendance Alert */}
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/30 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={emailNotifyStudentAttendance}
                          onChange={(e) => setEmailNotifyStudentAttendance(e.target.checked)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            📢 Student Attendance Alerts
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            Send email summary when student attendance is marked by teachers.
                          </span>
                        </div>
                      </label>

                      {/* Homework Submission Alert */}
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/30 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={emailNotifyHomeworkSubmitted}
                          onChange={(e) => setEmailNotifyHomeworkSubmitted(e.target.checked)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            📝 Homework & Practice Submissions
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            Send email notification when students submit completed practice worksheets.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={emailSaving}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {emailSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{emailSaving ? "Saving Settings..." : "Save Email Notification Settings"}</span>
                    </button>
                  </div>
                </form>

                {/* SENT EMAIL LOGS TABLE */}
                {showEmailLogs && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider font-display">
                        Sent Email Notification History ({emailLogs.length})
                      </h6>
                      <button
                        type="button"
                        onClick={fetchEmailLogs}
                        className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Refresh Logs
                      </button>
                    </div>

                    {emailLogs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl">
                        No email notifications dispatched yet. Click "Send Test Email" to verify the system.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Event Type</th>
                              <th className="p-3">Subject</th>
                              <th className="p-3">Recipient Email</th>
                              <th className="p-3">Sender Email</th>
                              <th className="p-3">Timestamp</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {emailLogs.map((log: any) => (
                              <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-3 font-bold text-slate-800 uppercase text-[10px]">
                                  <span className={`px-2 py-0.5 rounded-full ${
                                    log.type === "lead" ? "bg-amber-100 text-amber-800" :
                                    log.type === "fee" ? "bg-emerald-100 text-emerald-800" :
                                    log.type === "test" ? "bg-indigo-100 text-indigo-800" :
                                    "bg-slate-100 text-slate-700"
                                  }`}>
                                    {log.type}
                                  </span>
                                </td>
                                <td className="p-3 font-medium text-slate-900 max-w-xs truncate">{log.subject}</td>
                                <td className="p-3 font-mono text-[11px] text-slate-600">{log.recipientEmail}</td>
                                <td className="p-3 font-mono text-[11px] text-slate-500">{log.senderEmail}</td>
                                <td className="p-3 text-[10px] text-slate-400">
                                  {log.sentAt ? new Date(log.sentAt).toLocaleString() : "Just now"}
                                </td>
                                <td className="p-3">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    <CheckCircle2 className="w-3 h-3" /> Delivered
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NOTIFICATION PREFERENCES SUB-TAB */}
          {subTab === "NotificationPreferences" && (
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-indigo-500/30 text-indigo-200 rounded-xl border border-indigo-400/20">
                      <Bell className="w-5 h-5" />
                    </span>
                    <h4 className="text-xl font-black font-display tracking-tight text-white">Notification Preferences & Alert Channels</h4>
                  </div>
                  <p className="text-xs text-indigo-200/80 max-w-2xl leading-relaxed">
                    Configure registered recipient email addresses for Center Admins, set up event triggers for leads and fee receipts, and manage automated real-time alerts for assigned teachers when students submit practice or homework.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                  <span className={`w-2.5 h-2.5 rounded-full ${emailNotificationsEnabled ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
                  <span className="text-xs font-bold text-white">
                    {emailNotificationsEnabled ? "System Dispatch: ACTIVE" : "System Dispatch: PAUSED"}
                  </span>
                </div>
              </div>

              {/* Form Container */}
              <form onSubmit={handleSaveEmailSettings} className="space-y-6">
                {/* 1. Recipient & Sender Configuration */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-slate-900 font-display">Registered Email Addresses & Outbound Sender</h5>
                        <p className="text-xs text-slate-500">Select where notifications are delivered and specify the sender email ID</p>
                      </div>
                    </div>
                    {/* Master Switch */}
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700">Master Notifications Switch</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailNotificationsEnabled}
                          onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Primary Notification Recipient Email */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-800">
                        Primary Center Admin Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={notificationEmail}
                        onChange={(e) => setNotificationEmail(e.target.value)}
                        placeholder="admin@school.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white transition-all"
                      />
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-medium self-center">Quick Select:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const currentCenter = (centers || []).find(c => c.id === activeCenterId);
                            if (currentCenter?.email) setNotificationEmail(currentCenter.email);
                            else if (currentUser?.email) setNotificationEmail(currentUser.email);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition-colors border border-indigo-100"
                        >
                          Use Center Email ({((centers || []).find(c => c.id === activeCenterId)?.email) || "Current"})
                        </button>
                        {currentUser?.email && (
                          <button
                            type="button"
                            onClick={() => setNotificationEmail(currentUser.email)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors"
                          >
                            Use Account ({currentUser.email})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Additional CC Recipient Email Addresses */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-800">
                        Additional CC Email Addresses (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={ccEmails}
                        onChange={(e) => setCcEmails(e.target.value)}
                        placeholder="director@school.com, accounts@school.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white transition-all"
                      />
                      <p className="text-[10px] text-slate-400">
                        All alerts (leads, receipts, updates) will be carbon-copied to these additional registered emails.
                      </p>
                      {ccEmails && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {ccEmails.split(",").map(e => e.trim()).filter(Boolean).map((email, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                              <Mail className="w-2.5 h-2.5" /> {email}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Outbound Sender Email */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-xs font-bold text-slate-800">
                        Outbound Sender Email ID (Displayed in Received Emails) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="notifications@geniplus.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white transition-all max-w-md"
                      />
                      <p className="text-[10px] text-slate-400">
                        The outbound address shown on automated receipts and student notifications.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Outbound SMTP Server Configuration (Required for Real Inbox Delivery) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
                          Real Inbox SMTP Transport Settings
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${smtpHost && smtpUser ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"}`}>
                            {smtpHost && smtpUser ? "✨ SMTP Active (Inboxes Enabled)" : "⚠️ Internal Logs Only"}
                          </span>
                        </h5>
                        <p className="text-xs text-slate-500">Configure your SMTP server credentials to deliver actual physical emails directly to Gmail / Yahoo / Outlook inboxes.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSmtpDetails(!showSmtpDetails)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors border border-indigo-100"
                    >
                      {showSmtpDetails || (smtpHost && smtpUser) ? "Hide Config" : "Configure SMTP"}
                    </button>
                  </div>

                  {(!smtpHost || !smtpUser) && !showSmtpDetails && (
                    <div className="p-4 bg-amber-50/80 border border-amber-200/60 rounded-2xl text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-extrabold block">Why email notifications are not reaching physical inboxes:</span>
                        <span className="text-[11px] text-amber-800">
                          By default, notifications are logged in the internal system database. To transmit physical emails over the internet to real recipient inboxes, enter your SMTP credentials or Gmail App Password below.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSmtpDetails(true)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0 transition-colors shadow-xs"
                      >
                        Enter SMTP Details
                      </button>
                    </div>
                  )}

                  {(showSmtpDetails || (smtpHost && smtpUser)) && (
                    <div className="space-y-4 pt-1">
                      <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-950 leading-relaxed">
                        <strong className="block mb-1 font-black text-indigo-900">💡 Quick Setup Guide for Gmail Users:</strong>
                        1. Enable 2-Step Verification in your Google Account.<br/>
                        2. Search for <strong>"App Passwords"</strong> in Google Security settings.<br/>
                        3. Create a 16-character App Password, and fill below: Host: <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-[11px]">smtp.gmail.com</code>, Port: <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-[11px]">587</code>, User: <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-[11px]">your.email@gmail.com</code>, Password: 16-char App Password.
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">SMTP Host</label>
                          <input
                            type="text"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            placeholder="e.g. smtp.gmail.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">SMTP Port</label>
                          <input
                            type="number"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(Number(e.target.value))}
                            placeholder="587"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">SMTP Username / Email</label>
                          <input
                            type="email"
                            value={smtpUser}
                            onChange={(e) => setSmtpUser(e.target.value)}
                            placeholder="your.email@gmail.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">SMTP App Password</label>
                          <input
                            type="password"
                            value={smtpPass}
                            onChange={(e) => setSmtpPass(e.target.value)}
                            placeholder="•••• •••• •••• ••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Role-Based Email Notification System Controls */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-sm">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
                          Role-Based Email Notification System
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider">
                            SMTP Isolated & Granular
                          </span>
                        </h5>
                        <p className="text-xs text-slate-500">Enable or disable outgoing email notifications for specific roles and event categories</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* ROLE 1: Super Admin */}
                    <div className="p-5 bg-gradient-to-br from-rose-500/5 via-slate-50 to-white rounded-3xl border border-rose-200/80 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[10px] font-black uppercase rounded-lg border border-rose-200">
                            Super Admin
                          </span>
                          <span className="text-xs font-bold text-slate-900">Platform & Subscriptions</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rolePreferences.superAdmin?.enabled !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              superAdmin: { ...prev.superAdmin, enabled: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500">Notifies Center Admin / Main Center Owner using Super Admin SMTP for platform billing and quota alerts.</p>

                      <div className="space-y-2 pt-1">
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>🚨 Student Quota Warnings (80%, 90%, 100%)</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.superAdmin?.studentQuotaWarnings !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              superAdmin: { ...prev.superAdmin, studentQuotaWarnings: e.target.checked }
                            }))}
                            className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>🧾 Subscription Invoices & Payment Confirmations</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.superAdmin?.subscriptionInvoices !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              superAdmin: { ...prev.superAdmin, subscriptionInvoices: e.target.checked }
                            }))}
                            className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>⏰ Plan Expiry & Renewal Alerts</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.superAdmin?.expiringSoonAlerts !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              superAdmin: { ...prev.superAdmin, expiringSoonAlerts: e.target.checked }
                            }))}
                            className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                          />
                        </label>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleSendTestEmail("superadmin_quota", "superAdmin")}
                          disabled={testEmailLoading}
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Test Super Admin Quota Email
                        </button>
                      </div>
                    </div>

                    {/* ROLE 2: Center Admin */}
                    <div className="p-5 bg-gradient-to-br from-indigo-500/5 via-slate-50 to-white rounded-3xl border border-indigo-200/80 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase rounded-lg border border-indigo-200">
                            Center Admin
                          </span>
                          <span className="text-xs font-bold text-slate-900">Center Owner / Primary Admin</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rolePreferences.centerAdmin?.enabled !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              centerAdmin: { ...prev.centerAdmin, enabled: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500">Primary operational desk for lead inquiries, tuition payments, and daily center overview.</p>

                      <div className="space-y-2 pt-1">
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>📩 New Lead Inquiries & CRM Alerts</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.centerAdmin?.newInquiryLeads !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              centerAdmin: { ...prev.centerAdmin, newInquiryLeads: e.target.checked }
                            }))}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>🧾 Fee Payment Confirmations & Receipts</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.centerAdmin?.feePaymentReceipts !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              centerAdmin: { ...prev.centerAdmin, feePaymentReceipts: e.target.checked }
                            }))}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>🏆 Exam Prep & Hall Ticket Alerts</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.centerAdmin?.examPrepAlerts !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              centerAdmin: { ...prev.centerAdmin, examPrepAlerts: e.target.checked }
                            }))}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                        </label>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleSendTestEmail("lead", "centerAdmin")}
                          disabled={testEmailLoading}
                          className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Test Center Admin Lead Email
                        </button>
                      </div>
                    </div>

                    {/* ROLE 3: Manager */}
                    <div className="p-5 bg-gradient-to-br from-amber-500/5 via-slate-50 to-white rounded-3xl border border-amber-200/80 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-lg border border-amber-200">
                            Manager
                          </span>
                          <span className="text-xs font-bold text-slate-900">Center Operations Manager</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rolePreferences.manager?.enabled === true}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              manager: { ...prev.manager, enabled: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500">Daily operational performance, batch schedules, revenue summaries, and staff logs.</p>

                      <div className="space-y-2 pt-1">
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>📊 Daily Revenue & Batch Operations Summary</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.manager?.dailyRevenueSummary !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              manager: { ...prev.manager, dailyRevenueSummary: e.target.checked }
                            }))}
                            className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>📢 Attendance & Absence Alerts</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.manager?.attendanceAlerts !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              manager: { ...prev.manager, attendanceAlerts: e.target.checked }
                            }))}
                            className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                          />
                        </label>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleSendTestEmail("manager_summary", "manager")}
                          disabled={testEmailLoading}
                          className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Test Manager Operations Email
                        </button>
                      </div>
                    </div>

                    {/* ROLE 4: Marketing & Sales Staff */}
                    <div className="p-5 bg-gradient-to-br from-emerald-500/5 via-slate-50 to-white rounded-3xl border border-emerald-200/80 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-lg border border-emerald-200">
                            Marketing & Sales
                          </span>
                          <span className="text-xs font-bold text-slate-900">CRM & Follow-up Team</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rolePreferences.marketingSales?.enabled === true}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              marketingSales: { ...prev.marketingSales, enabled: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500">Instant notification when new leads are assigned or follow-up slots approach.</p>

                      <div className="space-y-2 pt-1">
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>🎯 New Inquiry Lead Assignment</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.marketingSales?.newInquiryLeads !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              marketingSales: { ...prev.marketingSales, newInquiryLeads: e.target.checked }
                            }))}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>⏰ Follow-up & Callback Reminders</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.marketingSales?.followUpReminders !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              marketingSales: { ...prev.marketingSales, followUpReminders: e.target.checked }
                            }))}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                          />
                        </label>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleSendTestEmail("marketing_lead", "marketingSales")}
                          disabled={testEmailLoading}
                          className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Test Marketing Desk Email
                        </button>
                      </div>
                    </div>

                    {/* ROLE 5: Assigned Teacher */}
                    <div className="p-5 bg-gradient-to-br from-purple-500/5 via-slate-50 to-white rounded-3xl border border-purple-200/80 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-[10px] font-black uppercase rounded-lg border border-purple-200">
                            Teacher
                          </span>
                          <span className="text-xs font-bold text-slate-900">Assigned Class Teacher</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rolePreferences.teacher?.enabled === true}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              teacher: { ...prev.teacher, enabled: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500">Student practice submissions, assigned batch homework, and 10:00 AM IST daily digest.</p>

                      <div className="space-y-2 pt-1">
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>🌅 10:00 AM IST Morning Practice Digest</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.teacher?.dailyPracticeDigest !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              teacher: { ...prev.teacher, dailyPracticeDigest: e.target.checked }
                            }))}
                            className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>📝 Student Practice & Homework Submissions</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.teacher?.assignedStudentSubmissions !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              teacher: { ...prev.teacher, assignedStudentSubmissions: e.target.checked }
                            }))}
                            className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>🎓 Exam Prep & Hall Ticket Verification</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.teacher?.examPrepAlerts !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              teacher: { ...prev.teacher, examPrepAlerts: e.target.checked }
                            }))}
                            className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                          />
                        </label>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendTestEmail("teacher_submission", "teacher")}
                          disabled={testEmailLoading}
                          className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-xl border border-purple-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Test Alert
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendTestEmail("digest", "teacher")}
                          disabled={testEmailLoading}
                          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1"
                        >
                          <Send className="w-3 h-3" /> 🌅 Test Digest
                        </button>
                      </div>
                    </div>

                    {/* ROLE 6: Parent & Student */}
                    <div className="p-5 bg-gradient-to-br from-blue-500/5 via-slate-50 to-white rounded-3xl border border-blue-200/80 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[10px] font-black uppercase rounded-lg border border-blue-200">
                            Parent & Student
                          </span>
                          <span className="text-xs font-bold text-slate-900">Student / Registered Parent Email</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rolePreferences.parentStudent?.enabled === true}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              parentStudent: { ...prev.parentStudent, enabled: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500">Official fee receipts, progress reports, exam prep schedules, and hall tickets.</p>

                      <div className="space-y-2 pt-1">
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>🧾 Tuition Fee Receipts & Payment Confirmation</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.parentStudent?.feePaymentReceipts !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              parentStudent: { ...prev.parentStudent, feePaymentReceipts: e.target.checked }
                            }))}
                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>🏆 Practice Progress & Certificate Issue Alerts</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.parentStudent?.practiceProgressReports !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              parentStudent: { ...prev.parentStudent, practiceProgressReports: e.target.checked }
                            }))}
                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                          <span>🎓 Exam Prep & Hall Ticket Schedule</span>
                          <input
                            type="checkbox"
                            checked={rolePreferences.parentStudent?.examPrepNotifications !== false}
                            onChange={(e) => setRolePreferences((prev: any) => ({
                              ...prev,
                              parentStudent: { ...prev.parentStudent, examPrepNotifications: e.target.checked }
                            }))}
                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                        </label>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleSendTestEmail("parent_receipt", "parentStudent")}
                          disabled={testEmailLoading}
                          className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Test Parent Fee Receipt Email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-slate-900 font-display">Center Admin Notification Event Triggers</h5>
                      <p className="text-xs text-slate-500">Select which activity events generate automated email dispatches to Center Admins</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* New Lead Alert */}
                    <label className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${emailNotifyNewLead ? "bg-amber-50/40 border-amber-200 shadow-xs" : "bg-slate-50/50 border-slate-200 opacity-70"}`}>
                      <input
                        type="checkbox"
                        checked={emailNotifyNewLead}
                        onChange={(e) => setEmailNotifyNewLead(e.target.checked)}
                        className="mt-1 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <div>
                        <span className="block text-xs font-black text-slate-900 flex items-center gap-2">
                          📩 New Student Lead & Inquiry Alerts
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Instant alert when prospective parents or students register via public website inquiry forms or CRM desk.
                        </span>
                      </div>
                    </label>

                    {/* Fee Receipts Alert */}
                    <label className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${emailNotifyFeeReceipt ? "bg-emerald-50/40 border-emerald-200 shadow-xs" : "bg-slate-50/50 border-slate-200 opacity-70"}`}>
                      <input
                        type="checkbox"
                        checked={emailNotifyFeeReceipt}
                        onChange={(e) => setEmailNotifyFeeReceipt(e.target.checked)}
                        className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <div>
                        <span className="block text-xs font-black text-slate-900 flex items-center gap-2">
                          🧾 Fee Collection & Payment Receipts
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Alert dispatched whenever tuition fees are paid, verified by admin, or payment proofs are uploaded.
                        </span>
                      </div>
                    </label>

                    {/* Student Attendance Summary */}
                    <label className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${emailNotifyStudentAttendance ? "bg-blue-50/40 border-blue-200 shadow-xs" : "bg-slate-50/50 border-slate-200 opacity-70"}`}>
                      <input
                        type="checkbox"
                        checked={emailNotifyStudentAttendance}
                        onChange={(e) => setEmailNotifyStudentAttendance(e.target.checked)}
                        className="mt-1 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <div>
                        <span className="block text-xs font-black text-slate-900 flex items-center gap-2">
                          📢 Student Attendance Summaries
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Daily summaries when teachers record batch attendance logs and absent status.
                        </span>
                      </div>
                    </label>

                    {/* System & Security Updates */}
                    <label className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${emailNotifySystemUpdates ? "bg-purple-50/40 border-purple-200 shadow-xs" : "bg-slate-50/50 border-slate-200 opacity-70"}`}>
                      <input
                        type="checkbox"
                        checked={emailNotifySystemUpdates}
                        onChange={(e) => setEmailNotifySystemUpdates(e.target.checked)}
                        className="mt-1 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <div>
                        <span className="block text-xs font-black text-slate-900 flex items-center gap-2">
                          🔔 System & Security Updates
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Alerts for batch schedule shifts, teacher assignments, and system audit logs.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 3. Teacher Student Submission Notification Channel */}
                <div className="bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-slate-50 border border-indigo-100 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-indigo-100/80 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-sm">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-slate-900 font-display">Teacher Alerts for Assigned Student Submissions</h5>
                        <p className="text-xs text-slate-500">Ensure teachers receive instant alerts when their students complete online practice or homework proofs</p>
                      </div>
                    </div>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-indigo-200">
                      Real-Time Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* In-App Teacher Dashboard Notifications Switch */}
                    <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                          <Bell className="w-4 h-4 text-indigo-600" />
                          In-App Dashboard Alerts
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          Always Enabled ✓
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Teachers automatically receive instant pulsing notifications at the top of their dashboard whenever one of their assigned students submits homework or completes online speed practice.
                      </p>
                    </div>

                    {/* Direct Teacher Email Dispatch Switch */}
                    <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-indigo-600" />
                          Direct Teacher Email Alerts
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailNotifyTeacherSubmissions}
                            onChange={(e) => setEmailNotifyTeacherSubmissions(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Send automated email alerts directly to each assigned teacher's registered email address (<code className="text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">teacher.email</code>) upon student submission.
                      </p>
                    </div>
                  </div>

                  {/* Registered Teachers Email Status */}
                  <div className="pt-2">
                    <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                      Active Teachers & Registered Email Addresses ({teachers.filter(t => !activeCenterId || t.centerId === activeCenterId || t.centerId === "ALL").length})
                    </h6>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {teachers.filter(t => !activeCenterId || t.centerId === activeCenterId || t.centerId === "ALL").map((t) => {
                        const studentCount = students.filter(s => s.teacherId === t.id).length;
                        return (
                          <div key={t.id} className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                            <div className="min-w-0 flex-1">
                              <span className="block text-xs font-bold text-slate-900 truncate">{t.name}</span>
                              <span className="block text-[11px] text-indigo-600 font-mono truncate">{t.email || "No email registered"}</span>
                              <span className="block text-[10px] text-slate-400 mt-0.5">{studentCount} assigned students</span>
                            </div>
                            <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${t.email ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                              {t.email ? "Alerts On" : "No Email"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Save Changes Button Bar */}
                <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>All changes are saved instantly and applied across all automated dispatch triggers.</span>
                  </div>
                  <button
                    type="submit"
                    disabled={emailSaving}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {emailSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{emailSaving ? "Saving Preferences..." : "Save Notification Preferences"}</span>
                  </button>
                </div>
              </form>

              {/* 4. Live Verification & Test Notification Engine */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-slate-900 font-display">Test Dispatch & Verification Engine</h5>
                      <p className="text-xs text-slate-500">Dispatch live test notifications to verify email delivery to primary and CC addresses</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendTestEmail("lead")}
                      disabled={testEmailLoading}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-amber-200"
                    >
                      {testEmailLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Test Lead Alert</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendTestEmail("fee")}
                      disabled={testEmailLoading}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-emerald-200"
                    >
                      {testEmailLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Test Fee Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendTestEmail("teacher_submission")}
                      disabled={testEmailLoading}
                      className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-purple-200"
                    >
                      {testEmailLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Test Direct Teacher Alert</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendTestEmail("digest")}
                      disabled={testEmailLoading}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                    >
                      {testEmailLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>🌅 Send Morning Practice Digest Now</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendTestEmail("submission")}
                      disabled={testEmailLoading}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-indigo-200"
                    >
                      {testEmailLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Test Student Submission</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendTestEmail("general")}
                      disabled={testEmailLoading}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      {testEmailLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Test General Status</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>Current Delivery Target: <strong className="text-slate-900 font-mono">{notificationEmail || "Not Set"}</strong> {ccEmails ? `(CC: ${ccEmails})` : ""}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailLogs(!showEmailLogs);
                      if (!showEmailLogs) fetchEmailLogs();
                    }}
                    className="text-indigo-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>{showEmailLogs ? "Hide History" : "View Sent Dispatch History"}</span>
                  </button>
                </div>

                {/* SENT EMAIL LOGS TABLE */}
                {showEmailLogs && (
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider font-display">
                        Sent Email Dispatch History ({emailLogs.length})
                      </h6>
                      <button
                        type="button"
                        onClick={fetchEmailLogs}
                        className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Refresh Logs
                      </button>
                    </div>

                    {emailLogs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No email notifications dispatched yet. Use the test buttons above to run live verification.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Event Type</th>
                              <th className="p-3">Subject</th>
                              <th className="p-3">Recipient Email</th>
                              <th className="p-3">Sender Email</th>
                              <th className="p-3">Timestamp</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {emailLogs.map((log: any) => (
                              <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-3 font-bold text-slate-800 uppercase text-[10px]">
                                  <span className={`px-2.5 py-1 rounded-full ${
                                    log.type === "lead" ? "bg-amber-100 text-amber-800" :
                                    log.type === "fee" ? "bg-emerald-100 text-emerald-800" :
                                    log.type === "homework" ? "bg-purple-100 text-purple-800" :
                                    log.type === "test" ? "bg-indigo-100 text-indigo-800" :
                                    "bg-slate-100 text-slate-700"
                                  }`}>
                                    {log.type}
                                  </span>
                                </td>
                                <td className="p-3 font-medium text-slate-900 max-w-xs truncate">{log.subject}</td>
                                <td className="p-3 font-mono text-[11px] text-slate-600">{log.recipientEmail}</td>
                                <td className="p-3 font-mono text-[11px] text-slate-500">{log.senderEmail}</td>
                                <td className="p-3 text-[10px] text-slate-400 whitespace-nowrap">
                                  {log.sentAt ? new Date(log.sentAt).toLocaleString() : "Just now"}
                                </td>
                                <td className="p-3">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                                    <CheckCircle2 className="w-3 h-3" /> Delivered
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INTEGRATED PROFESSIONAL FINANCIAL SYSTEM (PARTS 1-14) */}
          {(subTab === "Expenses" || subTab === "PnL") && (
            <div className="space-y-4 animate-fade-in" id="academy-integrated-accounting-section">
              <AccountingView
                currentUser={{
                  email: currentUser?.email || "",
                  name: currentUser?.name || "",
                  role: currentUser?.role || "Center Admin",
                  centerId: activeCenterId
                }}
                centers={centers || []}
                teachers={teachers}
                students={students}
                fees={fees}
                onRefreshData={async () => {
                  if (onRefreshData) onRefreshData();
                }}
              />
            </div>
          )}

          {/* CONCEPT WORKSHEETS SUB-TAB */}
          {subTab === "ConceptWorksheets" && (
            <div className="space-y-4 animate-fade-in">
              <ConceptWorksheetManager
                currentTeacher={{
                  id: activeCenterId,
                  centerId: activeCenterId,
                  name: activeCenterOwner,
                  email: activeCenterEmail,
                  mobile: "9999999999",
                  joiningDate: "2026-01-01",
                  role: "Center Admin",
                  status: "Active"
                }}
                students={students}
                onRefreshData={async () => {
                  // No-op refresh
                }}
              />
            </div>
          )}

          {/* MATERIAL DISPATCH SUB-TAB */}
          {subTab === "Materials" && (
            <div className="space-y-6 animate-fade-in" id="material-dispatch-tab-view">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-base font-black text-slate-950 font-display">Material Management & Logistics Tracker</h4>
                  <p className="text-xs text-slate-500">Track study materials, books, courier dispatches, and student shipment logistics for your Abacus center.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingMaterial(null);
                    setShowAddMaterial(!showAddMaterial);
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 border border-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer shadow-md"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log New Dispatch Shipment</span>
                </button>
              </div>

              {/* Add Material Dispatch Record Form */}
              {showAddMaterial && (
                <form onSubmit={handleCreateMaterial} className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4 animate-fade-in">
                  <div className="text-xs font-black text-indigo-950 uppercase tracking-wider font-display">Log Study Kit / Book Dispatch</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Select Student</label>
                      <select
                        required
                        value={matStudentId}
                        onChange={(e) => setMatStudentId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Select Enrolled Student --</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.studentName} (Level {s.currentLevel})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Dispatch Status</label>
                      <select
                        value={matStatus}
                        onChange={(e) => setMatStatus(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Pending">Pending / Ordered</option>
                        <option value="Dispatched">Dispatched / Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Courier Tracking Number (Optional)</label>
                      <input
                        type="text"
                        value={matTracking}
                        onChange={(e) => setMatTracking(e.target.value)}
                        placeholder="e.g. DTDC849104859 or SpeedPost"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Material Fee (₹)</label>
                      <input
                        type="number"
                        required
                        value={matMaterialFee}
                        onChange={(e) => setMatMaterialFee(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Book Fee (₹)</label>
                      <input
                        type="number"
                        required
                        value={matBookFee}
                        onChange={(e) => setMatBookFee(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Courier Fee (₹)</label>
                      <input
                        type="number"
                        required
                        value={matCourierFee}
                        onChange={(e) => setMatCourierFee(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setShowAddMaterial(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
                    >
                      Create Logistic Record
                    </button>
                  </div>
                </form>
              )}

              {/* Inline Edit form for selected dispatch */}
              {editingMaterial && (
                <form onSubmit={handleUpdateMaterialStatus} className="bg-amber-50/50 border border-amber-200 rounded-3xl p-5 space-y-4 animate-fade-in">
                  <div className="text-xs font-black text-amber-950 uppercase tracking-wider font-display">Update Dispatch Record #{editingMaterial.id}</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Student</label>
                      <input
                        type="text"
                        disabled
                        value={students.find(s => s.id === editingMaterial.studentId)?.studentName || editingMaterial.studentId}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Dispatch Status</label>
                      <select
                        value={editMatStatus}
                        onChange={(e) => setEditMatStatus(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Pending">Pending / Ordered</option>
                        <option value="Dispatched">Dispatched / Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Courier Tracking Number</label>
                      <input
                        type="text"
                        value={editMatTracking}
                        onChange={(e) => setEditMatTracking(e.target.value)}
                        placeholder="Tracking details..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Material Fee (₹)</label>
                      <input
                        type="number"
                        required
                        value={editMatMaterialFee}
                        onChange={(e) => setEditMatMaterialFee(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Book Fee (₹)</label>
                      <input
                        type="number"
                        required
                        value={editMatBookFee}
                        onChange={(e) => setEditMatBookFee(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Courier Fee (₹)</label>
                      <input
                        type="number"
                        required
                        value={editMatCourierFee}
                        onChange={(e) => setEditMatCourierFee(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                    <button
                      type="button"
                      onClick={() => setEditingMaterial(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-750 text-white shadow-sm cursor-pointer"
                    >
                      Save Dispatch Changes
                    </button>
                  </div>
                </form>
              )}

              {/* List table of all Shipments */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs">
                <div className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
                  Study Materials dispatch ledgers
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono uppercase tracking-wider">
                        <th className="p-3">Student</th>
                        <th className="p-3">Material Fee</th>
                        <th className="p-3">Book Fee</th>
                        <th className="p-3">Courier Fee</th>
                        <th className="p-3">Total Cost</th>
                        <th className="p-3">Dispatch Status</th>
                        <th className="p-3">Tracking Reference</th>
                        <th className="p-3">Last Updated</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const allMats = (materials || []).filter(m => m.centerId === activeCenterId);
                        
                        if (allMats.length === 0) {
                          return (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-400 text-xs italic font-semibold">
                                No material shipments recorded for this academy center yet.
                              </td>
                            </tr>
                          );
                        }

                        return allMats.map((mat: any) => {
                          const studentObj = students.find(s => s.id === mat.studentId);
                          const totalCost = (mat.materialFee || 0) + (mat.bookFee || 0) + (mat.courierFee || 0);
                          
                          let statusColor = "bg-amber-50 border-amber-100 text-amber-700";
                          const currentStatus = mat.dispatchStatus || mat.status || "Pending";
                          if (currentStatus === "Dispatched") {
                            statusColor = "bg-sky-50 border-sky-100 text-sky-700";
                          } else if (currentStatus === "Delivered") {
                            statusColor = "bg-emerald-50 border-emerald-100 text-emerald-700";
                          }

                          return (
                            <tr key={mat.id} className="hover:bg-slate-50/50">
                              <td className="p-3">
                                <div className="font-extrabold text-slate-900">{studentObj?.studentName || "Unknown Student"}</div>
                                <div className="text-[10px] text-slate-400 font-medium font-mono">{mat.studentId}</div>
                              </td>
                              <td className="p-3 font-mono font-semibold">₹{mat.materialFee || 0}</td>
                              <td className="p-3 font-mono font-semibold font-medium">₹{mat.bookFee || 0}</td>
                              <td className="p-3 font-mono font-semibold text-slate-400">₹{mat.courierFee || 0}</td>
                              <td className="p-3 font-mono font-bold text-slate-900">₹{totalCost}</td>
                              <td className="p-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${statusColor}`}>
                                  {currentStatus}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-xs text-slate-500 font-bold">
                                {mat.trackingNumber ? mat.trackingNumber : <span className="text-slate-300 italic font-normal">Not Provided</span>}
                              </td>
                              <td className="p-3 text-[10px] text-slate-400 font-mono">
                                {mat.updatedAt ? new Date(mat.updatedAt).toLocaleDateString() : "-"}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMaterial(mat);
                                    setEditMatStatus(currentStatus);
                                    setEditMatTracking(mat.trackingNumber || "");
                                    setEditMatMaterialFee(mat.materialFee || 1200);
                                    setEditMatBookFee(mat.bookFee || 600);
                                    setEditMatCourierFee(mat.courierFee || 150);
                                    setShowAddMaterial(false);
                                  }}
                                  className="text-xs font-black text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                >
                                  Update Logistics
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ORDER MATERIALS SUB-TAB */}
          {subTab === "OrderMaterials" && (() => {
            const centerCartItems = Object.keys(centerCart).map(id => {
              const p = (materialProducts || []).find((prod: any) => prod.id === id);
              return { product: p, quantity: centerCart[id] };
            }).filter(item => item.product !== undefined);

            const centerSubtotal = centerCartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
            const centerTotalWeight = centerCartItems.reduce((acc, item) => acc + ((item.product.weight || 0) * item.quantity), 0);

            let centerShippingCharge = 0;
            if (centerTotalWeight > 0) {
              const sRule = shippingSettings || { baseWeightLimit: 500, baseShippingCharge: 60, additionalWeightStep: 500, additionalShippingCharge: 40 };
              const baseLimit = Number(sRule.baseWeightLimit) || 500;
              const baseCharge = Number(sRule.baseShippingCharge) || 60;
              const stepWeight = Number(sRule.additionalWeightStep) || 500;
              const stepCharge = Number(sRule.additionalShippingCharge) || 40;

              if (centerTotalWeight <= baseLimit) {
                centerShippingCharge = baseCharge;
              } else {
                const extra = centerTotalWeight - baseLimit;
                const steps = Math.ceil(extra / stepWeight);
                centerShippingCharge = baseCharge + (steps * stepCharge);
              }
            }

            const centerGrandTotal = centerSubtotal + centerShippingCharge;
            const myCenterOrders = (materialOrders || []).filter((o: any) => o.centerId === activeCenterId);

            return (
              <div className="space-y-8 animate-fade-in" id="center-order-materials-view">
                <div className="border-b border-slate-100 pb-4">
                  <h4 className="text-base font-black text-slate-950 font-display">AOS Learning Material & Tool Procurement</h4>
                  <p className="text-xs text-slate-500">Procure official Geniplus Abacus learning kits, curriculum student books, and coaching tools direct from Head Office.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Product Selection */}
                  <div className="lg:col-span-7 space-y-6">
                    <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-indigo-600" /> Available Procurement Catalog
                    </h5>

                    {(!materialProducts || materialProducts.length === 0) ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-150 text-slate-400 text-xs">
                        No materials or curriculum books are currently active in the central inventory.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {materialProducts.map((p: any) => {
                          const qty = centerCart[p.id] || 0;
                          return (
                            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all shadow-xs">
                              <div className="space-y-1.5">
                                {p.image && (
                                  <div className="w-full h-28 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 mb-2.5 flex items-center justify-center shrink-0">
                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                )}
                                <div className="flex justify-between items-start gap-1">
                                  <h6 className="font-extrabold text-xs text-slate-900 font-display line-clamp-2 leading-snug">{p.name}</h6>
                                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                                    ₹{p.price}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{p.description}</p>
                                <div className="flex gap-3 pt-0.5 text-[9px] font-mono text-slate-400">
                                  <span>Weight: {p.weight}g</span>
                                  <span>•</span>
                                  <span>HO Stock: {p.stock > 0 ? `${p.stock} units` : "Out of Stock"}</span>
                                </div>
                              </div>

                              {p.stock > 0 ? (
                                <div className="flex justify-between items-center gap-2 pt-1 border-t border-slate-100/60">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Order Qty</span>
                                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCenterCart(prev => {
                                          const current = prev[p.id] || 0;
                                          const next = Math.max(0, current - 1);
                                          const updated = { ...prev };
                                          if (next === 0) delete updated[p.id];
                                          else updated[p.id] = next;
                                          return updated;
                                        });
                                      }}
                                      className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors text-xs font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="w-7 text-center text-xs font-mono font-bold text-slate-800">
                                      {qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCenterCart(prev => ({
                                          ...prev,
                                          [p.id]: (prev[p.id] || 0) + 1
                                        }));
                                      }}
                                      className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors text-xs font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-slate-50 border border-slate-100 p-1.5 text-center rounded-lg text-[9px] font-bold text-rose-500">
                                  Temporarily Out Of Stock at HO
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Order Form & Payment */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-5">
                      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                        <ShoppingCart className="w-4 h-4 text-indigo-600" />
                        <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-display">Procurement Cart</h5>
                      </div>

                      {centerCartItems.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          Your procurement cart is empty. Please select quantities from the catalog.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {centerCartItems.map(item => (
                              <div key={item.product!.id} className="flex justify-between items-center text-xs font-medium">
                                <div className="space-y-0.5">
                                  <span className="text-slate-700 font-semibold">{item.product!.name}</span>
                                  <span className="block text-[10px] text-slate-400 font-mono">
                                    ₹{item.product!.price} × {item.quantity} ({(item.product!.weight || 0) * item.quantity}g)
                                  </span>
                                </div>
                                <span className="font-mono text-slate-900 font-bold shrink-0">₹{item.product!.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-slate-150 pt-2.5 space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-500">
                              <span>Subtotal</span>
                              <span className="font-mono text-slate-900 font-bold">₹{centerSubtotal}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>Total Weight</span>
                              <span className="font-mono text-indigo-600 font-bold">
                                {centerTotalWeight >= 1000 ? `${(centerTotalWeight / 1000).toFixed(2)} kg` : `${centerTotalWeight}g`}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>HO Shipping Fee</span>
                              <span className="font-mono text-slate-900 font-bold">₹{centerShippingCharge}</span>
                            </div>
                            <div className="flex justify-between border-t border-dashed border-slate-200 pt-2.5 text-xs font-black">
                              <span className="text-indigo-600">GRAND TOTAL</span>
                              <span className="font-mono text-slate-900 text-sm">₹{centerGrandTotal}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handlePlaceCenterOrder} className="space-y-4 pt-1.5">
                        <div className="space-y-2.5">
                          <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Procurement Delivery Details
                          </h6>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Contact Name</label>
                              <input
                                type="text"
                                required
                                value={centerOrderName}
                                onChange={e => setCenterOrderName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Contact Phone</label>
                              <input
                                type="tel"
                                required
                                value={centerOrderPhone}
                                onChange={e => setCenterOrderPhone(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Dispatch Email</label>
                            <input
                              type="email"
                              required
                              value={centerOrderEmail}
                              onChange={e => setCenterOrderEmail(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Courier Shipping Address</label>
                            <textarea
                              required
                              rows={2.5}
                              value={centerOrderAddress}
                              onChange={e => setCenterOrderAddress(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 resize-none"
                            />
                          </div>
                        </div>

                        {/* HO Bank Details */}
                        <div className="bg-indigo-50/75 border border-indigo-100 p-3.5 rounded-xl space-y-2 text-xs">
                          <h6 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1">
                            <Landmark className="w-3 h-3 text-indigo-600" /> Head Office Payment Account
                          </h6>
                          <div className="bg-white border border-indigo-100/60 rounded-lg p-2.5 space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Bank Name</span>
                              <span className="font-extrabold text-slate-800">{saasBank}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Account Holder</span>
                              <span className="font-extrabold text-slate-800 line-clamp-1 text-right">{saasHolder}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Account Number</span>
                              <span className="font-mono font-black text-slate-800 select-all">{saasAccount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">IFSC Routing Code</span>
                              <span className="font-mono font-black text-slate-800 select-all">{saasIfsc}</span>
                            </div>
                            <div className="flex justify-between pt-0.5 border-t border-slate-100 mt-1">
                              <span className="text-slate-400 font-bold">UPI ID</span>
                              <span className="font-mono font-black text-indigo-600 select-all">{saasUpi}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-0.5 pt-1">
                            <label className="text-[9px] font-bold text-indigo-950 uppercase block">Bank IMPS / UPI Reference ID</label>
                            <input
                              type="text"
                              required
                              placeholder="12-digit transaction ID"
                              value={centerOrderPaymentRef}
                              onChange={e => setCenterOrderPaymentRef(e.target.value)}
                              className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-indigo-950"
                            />
                          </div>
                        </div>

                        {centerOrderSuccess && (
                          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-2.5 rounded-lg text-xs font-semibold">
                            {centerOrderSuccess}
                          </div>
                        )}

                        {centerOrderError && (
                          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-2.5 rounded-lg text-xs font-semibold">
                            {centerOrderError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={centerOrderSubmitting || centerCartItems.length === 0}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {centerOrderSubmitting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Submitting Procurement...</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Submit Procurement Order (₹{centerGrandTotal})</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                {/* HISTORICAL PROCUREMENT LOG */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <ClipboardList className="w-4 h-4 text-indigo-600" />
                    <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider font-display">Procurement Order History</h5>
                  </div>

                  {(myCenterOrders.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-150 text-slate-400 text-xs">
                      No procurement orders placed yet. Once you submit your first order, it will show up here to track shipping and HO verification status.
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                              <th className="py-3.5 px-4">Order ID</th>
                              <th className="py-3.5 px-4">Date</th>
                              <th className="py-3.5 px-4">Items Summary</th>
                              <th className="py-3.5 px-4">Total Price</th>
                              <th className="py-3.5 px-4">Payment</th>
                              <th className="py-3.5 px-4">Status</th>
                              <th className="py-3.5 px-4">Logistics / Tracker</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {myCenterOrders.map((order: any) => (
                              <tr key={order.id} className="hover:bg-slate-50/55 transition-colors">
                                <td className="py-3 px-4 font-mono font-bold text-slate-900">#{order.id}</td>
                                <td className="py-3 px-4 text-slate-500">{order.orderDate}</td>
                                <td className="py-3 px-4 text-slate-700 font-medium max-w-xs truncate">
                                  {order.items.map((it: any) => `${it.name} (x${it.quantity})`).join(", ")}
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-900 font-mono">₹{order.totalAmount}</td>
                                <td className="py-3 px-4">
                                  <div className="space-y-0.5">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      order.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                    }`}>
                                      {order.paymentStatus || "Pending"}
                                    </span>
                                    {order.paymentRef && (
                                      <span className="block text-[8px] font-mono text-slate-400">Ref: {order.paymentRef}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    order.status === "Delivered" ? "bg-emerald-50 text-emerald-600" :
                                    order.status === "Shipped" ? "bg-blue-50 text-blue-600" :
                                    order.status === "Cancelled" ? "bg-rose-50 text-rose-600" :
                                    "bg-amber-50 text-amber-600"
                                  }`}>
                                    {order.status || "Pending"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">
                                  {order.trackingNumber ? (
                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                      {order.trackingNumber}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Pending Shipment</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* CRM SUB-TAB */}
          {subTab === "CRM" && (
            <div className="space-y-4 animate-fade-in">
              <CrmView leads={leads} onAddLead={onAddLead} teachers={teachers} currentUser={loggedInInfo} currentRole={loggedInInfo?.role || "Center Admin"} />
            </div>
          )}

          {/* AOS SUBSCRIPTION SUB-TAB */}
          {subTab === "AOS Subscription" && (
            <div className="space-y-6 animate-fade-in" id="aos-subscription-tab-view">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-base font-black text-slate-950 font-display">Abacus Academy Operating System (AOS) Subscription</h4>
                  <p className="text-xs text-slate-500">Manage your Venture/Academy software access plan, settle outstanding subscription bills, or download historical payment receipts.</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-1.5 flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">Connected to Abacus Central</span>
                </div>
              </div>

              {/* Status Overview Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Service Plan</div>
                  <div className="text-xl font-black text-slate-900 mt-1 font-display">
                    {activeCenter?.planType === "Custom"
                      ? `Custom Plan (${activeCenter?.studentLimit || 25} Students)`
                      : `${activeCenter?.plan || "Starter Plan"} (${activeCenter?.studentLimit || 10} Students)`}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-2 flex flex-col gap-0.5">
                    <div>Students Used: <span className="font-extrabold text-indigo-950">{students.filter(s => s.status === "Active").length} / {activeCenter?.studentLimit || (activeCenter?.planType === "Custom" ? 25 : 10)}</span></div>
                    <div>Remaining Seats: <span className="font-extrabold text-emerald-600">{Math.max(0, (activeCenter?.studentLimit || (activeCenter?.planType === "Custom" ? 25 : 10)) - students.filter(s => s.status === "Active").length)}</span></div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">AOS Subscription Validity</div>
                  <div className="text-xl font-black text-slate-900 mt-1 font-display">
                    {activeCenter?.subscriptionExpiry ? new Date(activeCenter.subscriptionExpiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "July 15, 2027"}
                  </div>
                  <div className="text-xs font-semibold mt-2 flex items-center gap-1">
                    <span className="text-emerald-600 font-bold">● Active Status</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-400">Autopay Disabled</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Outstanding AOS Balance</div>
                  <div className="text-xl font-black mt-1 font-display text-rose-600">
                    ₹{unpaidSaaSInvoices.reduce((acc, c) => acc + c.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-2">
                    Pending Invoices: <span className="font-bold text-slate-700">{unpaidSaaSInvoices.length} Due</span>
                  </div>
                </div>
              </div>

              {/* Core Billing Gate & Settlement */}
              {unpaidSaaSInvoices.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-amber-50/50 border-2 border-amber-100 rounded-3xl p-6" id="payment-settlement-gateway">
                  
                  {/* Left info column: Super Admin Bank & UPI settings loaded dynamically */}
                  <div className="lg:col-span-7 space-y-4 text-left">
                    <div>
                      <span className="bg-amber-100 text-amber-900 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Direct Settlement Gateway
                      </span>
                      <h5 className="text-sm font-black text-amber-950 font-display mt-2">
                        How to Pay Your Outstanding Bill (₹{invoiceToPay?.amount?.toLocaleString() || "0"})
                      </h5>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Please pay the exact amount using any of the official head-office accounts below, copy the transaction details, and submit the reference number on the right for instant reconciliation.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bank Details Card */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                          Option 1: Bank Transfer
                        </div>
                        
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">Account Holder</div>
                            <div className="font-semibold text-slate-900 truncate">{saasHolder}</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">Bank Name</div>
                            <div className="font-semibold text-slate-900">{saasBank}</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">Account Number</div>
                            <div className="font-mono font-bold text-slate-900 flex items-center justify-between gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              <span className="truncate">{saasAccount}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(saasAccount);
                                  alert("Account number copied!");
                                }}
                                className="text-[9px] text-indigo-600 hover:underline font-sans font-bold uppercase shrink-0 cursor-pointer"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">Bank IFSC Code</div>
                            <div className="font-mono font-bold text-slate-900 flex items-center justify-between gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              <span>{saasIfsc}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(saasIfsc);
                                  alert("IFSC Code copied!");
                                }}
                                className="text-[9px] text-indigo-600 hover:underline font-sans font-bold uppercase shrink-0 cursor-pointer"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* UPI QR & ID Card */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                            Option 2: UPI Transfer
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="text-[9px] text-slate-400 font-bold uppercase">UPI VPA Address</div>
                            <div className="font-mono font-bold text-slate-900 flex items-center justify-between gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              <span className="truncate">{saasUpi}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(saasUpi);
                                  alert("UPI ID copied!");
                                }}
                                className="text-[9px] text-indigo-600 hover:underline font-sans font-bold uppercase shrink-0 cursor-pointer"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Simulated Scan QR Area */}
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-3 mt-1">
                          <div className="w-12 h-12 bg-white border border-slate-200 rounded p-1 flex items-center justify-center shrink-0">
                            {/* UPI styled grid logo mockup */}
                            <div className="grid grid-cols-3 gap-0.5 w-10 h-10 opacity-70">
                              <div className="bg-indigo-900" />
                              <div className="bg-transparent" />
                              <div className="bg-indigo-900" />
                              <div className="bg-transparent" />
                              <div className="bg-indigo-900" />
                              <div className="bg-transparent" />
                              <div className="bg-indigo-900" />
                              <div className="bg-transparent" />
                              <div className="bg-indigo-900" />
                            </div>
                          </div>
                          <div className="text-[10px] leading-tight text-slate-500">
                            <div className="font-bold text-slate-700">Scan & Pay</div>
                            Scan with GPay, PhonePe, or BHIM UPI app directly.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/60 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 italic">
                      <strong className="text-slate-800">Head Office Instructions:</strong> {saasNotes}
                    </div>
                  </div>

                  {/* Right column: Form to submit transaction ID / proof reference */}
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit">
                    <h6 className="text-xs font-black text-indigo-950 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                      Submit Payment Proof
                    </h6>

                    {saasBillPaidSuccess && (
                      <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl p-3 font-bold animate-fade-in">
                        {saasBillPaidSuccess}
                      </div>
                    )}

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!invoiceToPay) {
                        alert("No unpaid invoice selected.");
                        return;
                      }
                      if (!paymentRefInput.trim()) {
                        alert("Please enter a valid Transaction Reference ID (UPI/NEFT)");
                        return;
                      }
                      setPaymentSubmitting(true);
                      
                      try {
                        const res = await fetch("/api/erp/saas-invoices/update", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: invoiceToPay.id,
                            status: "Paid",
                            paymentMode: paymentMethodInput,
                            referenceId: paymentRefInput.trim(),
                            paidDate: new Date().toISOString().split("T")[0]
                          })
                        });
                        const data = await res.json();
                        if (data.success && data.invoice) {
                          setSaasInvoices(prev => prev.map(inv => inv.id === invoiceToPay.id ? data.invoice : inv));
                          setSaasBillPaidSuccess(`✓ Payment proof reference submitted for invoice ${invoiceToPay.id}! Settle process initiated successfully.`);
                          setPaymentRefInput("");
                          setTimeout(() => {
                            setSaasBillPaidSuccess("");
                          }, 3500);
                        } else {
                          alert("Failed to submit payment proof: " + data.error);
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setPaymentSubmitting(false);
                      }
                    }} className="space-y-4 text-xs">
                      {unpaidSaaSInvoices.length > 1 && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Bill / Invoice to Pay</label>
                          <select
                            value={invoiceToPay?.id || ""}
                            onChange={(e) => setSelectedInvoiceToPayId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {unpaidSaaSInvoices.map((inv: any) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.id} - ₹{inv.amount.toLocaleString()} ({inv.planName})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Paying Invoice ID</label>
                        <input
                          type="text"
                          disabled
                          value={invoiceToPay ? `${invoiceToPay.id} (₹${invoiceToPay.amount.toLocaleString()})` : "No pending invoice"}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Method Used</label>
                        <select
                          value={paymentMethodInput}
                          onChange={(e) => setPaymentMethodInput(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="UPI Transfer">UPI Transfer (GooglePay / PhonePe / Paytm)</option>
                          <option value="NetBanking (NEFT/IMPS)">NetBanking Transfer (NEFT/IMPS/RTGS)</option>
                          <option value="Direct Bank Deposit">Direct Bank Branch Cash/Cheque Deposit</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Transaction Ref / UTR / Reference ID</label>
                        <input
                          type="text"
                          required
                          value={paymentRefInput}
                          onChange={(e) => setPaymentRefInput(e.target.value)}
                          placeholder="e.g. UPI Ref 3491204859 or Bank NEFT ID"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={paymentSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        {paymentSubmitting ? "Submitting Proof Reference..." : `Submit Payment of ₹${(invoiceToPay?.amount || 0).toLocaleString()}`}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Invoices and ledger breakdown */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="text-sm font-extrabold text-indigo-950 font-display">Historical Invoices & Billing Logs</h5>
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Center ID Match Mode</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono uppercase tracking-wider">
                        <th className="p-3">Invoice ID</th>
                        <th className="p-3">Billing Plan</th>
                        <th className="p-3">Issued Date</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Payment Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const allInvs = saasInvoices.filter((inv: any) => inv.centerId === activeCenterId);
                        
                        if (allInvs.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400 text-xs font-semibold">
                                No SaaS invoices logged yet for your center. All clear!
                              </td>
                            </tr>
                          );
                        }

                        return allInvs.map((inv: any) => {
                          const isPaid = inv.status === "Paid";
                          return (
                            <tr key={inv.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-slate-900">{inv.id}</td>
                              <td className="p-3 font-semibold text-slate-700">{inv.planName}</td>
                              <td className="p-3 font-mono text-slate-400">{inv.issuedDate}</td>
                              <td className="p-3 font-mono text-slate-400">{inv.dueDate}</td>
                              <td className="p-3 font-mono font-bold text-slate-900">₹{inv.amount.toLocaleString()}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                                  isPaid ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-rose-50 border border-rose-100 text-rose-700"
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[10px] text-slate-500">
                                {isPaid ? (
                                  <div>
                                    <span className="font-bold text-slate-700">{inv.paymentMode || "UPI"}</span> • {inv.referenceId || "Direct Settle"}
                                    <span className="block text-[9px] text-slate-400 font-normal">Paid on {inv.paidDate}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 italic shrink-0">Awaiting Payment</span>
                                    <button
                                      onClick={() => {
                                        setSelectedInvoiceToPayId(inv.id);
                                        const el = document.getElementById("payment-settlement-gateway");
                                        if (el) {
                                          el.scrollIntoView({ behavior: "smooth" });
                                        }
                                      }}
                                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
                                    >
                                      Pay Now
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MULTI-CENTER NETWORK MANAGEMENT SUB-TAB */}
          {subTab === "MultiCenter" && (
            <div className="space-y-6 animate-fade-in" id="multicenter-network-tab-view">
              {/* Header Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-amber-500/10 via-amber-50 to-white p-5 rounded-3xl border-2 border-amber-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Franchise Master Account
                    </span>
                    <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {centers.length} Total Branches
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-slate-950 font-display mt-1">
                    👑 Multi-Center / Super Center Network Hub
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Manage your sub-center branches, monitor shared student/staff allocations, and add new network branches.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddBranchModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-5 py-3 rounded-2xl transition-all shadow-md shadow-amber-200 flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Sub-Center Branch</span>
                </button>
              </div>

              {/* Shared Capacity & Utilization Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 shadow-sm">
                  <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Connected Branches</div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-display">
                    {centers.length} / {activeCenter?.centerLimit || 1}
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (centers.length / (activeCenter?.centerLimit || 1)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-bold">
                    {Math.max(0, (activeCenter?.centerLimit || 1) - centers.length)} Branch slots available
                  </p>
                </div>

                <div className="bg-white border-2 border-indigo-100 rounded-3xl p-5 shadow-sm">
                  <div className="text-[10px] font-black text-indigo-800 uppercase tracking-wider">Shared Active Students</div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-display">
                    {initialStudents.filter(s => s.status === "Active").length} / {activeCenter?.studentLimit || 10}
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (initialStudents.filter(s => s.status === "Active").length / (activeCenter?.studentLimit || 10)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-bold">
                    {Math.max(0, (activeCenter?.studentLimit || 10) - initialStudents.filter(s => s.status === "Active").length)} Seats remaining across all branches
                  </p>
                </div>

                <div className="bg-white border-2 border-emerald-100 rounded-3xl p-5 shadow-sm">
                  <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Shared Teachers</div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-display">
                    {initialTeachers.filter(t => t.status === "Active" && !t.role?.toLowerCase().includes("staff")).length} / {activeCenter?.teacherLimit || 10}
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (initialTeachers.filter(t => t.status === "Active" && !t.role?.toLowerCase().includes("staff")).length / (activeCenter?.teacherLimit || 10)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-bold">
                    Active teaching staff across branches
                  </p>
                </div>

                <div className="bg-white border-2 border-purple-100 rounded-3xl p-5 shadow-sm">
                  <div className="text-[10px] font-black text-purple-800 uppercase tracking-wider">Shared Support Staff</div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-display">
                    {initialTeachers.filter(t => t.status === "Active" && t.role?.toLowerCase().includes("staff")).length} / {activeCenter?.staffLimit || 5}
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (initialTeachers.filter(t => t.status === "Active" && t.role?.toLowerCase().includes("staff")).length / (activeCenter?.staffLimit || 5)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-bold">
                    Managers, counselors & operational staff
                  </p>
                </div>
              </div>

              {/* Sub-Center Branches List */}
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-black text-slate-900 font-display">Connected Sub-Center Network Branches</h5>
                    <p className="text-xs text-slate-500">List of all branches under this Super Center franchise account.</p>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    {centers.length} Branches Registered
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {centers.map(branch => {
                    const isMain = branch.id === activeCenterId || branch.isSuperCenter;
                    const branchStudentsCount = initialStudents.filter(s => s.centerId === branch.id).length;
                    const branchTeachersCount = initialTeachers.filter(t => t.centerId === branch.id).length;

                    return (
                      <div
                        key={branch.id}
                        className={`rounded-2xl p-5 border-2 transition-all flex flex-col justify-between space-y-4 ${
                          isMain
                            ? "bg-gradient-to-br from-amber-50/80 to-white border-amber-300 shadow-sm"
                            : "bg-white border-slate-200 hover:border-amber-200 hover:shadow-md"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              isMain ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}>
                              {isMain ? "👑 Main Center" : "🏢 Sub-Center Branch"}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-400">{branch.id}</span>
                          </div>

                          <h6 className="text-base font-black text-slate-900 mt-2 font-display">{branch.name}</h6>
                          <div className="text-xs font-medium text-slate-600 mt-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{branch.city || "Branch City"}{branch.state ? `, ${branch.state}` : ""}</span>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1">
                            <div className="text-slate-600 font-semibold flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Manager/Owner: <strong className="text-slate-900">{branch.ownerName || "Branch Head"}</strong></span>
                            </div>
                            <div className="text-slate-600 font-semibold flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Mobile: <strong className="text-slate-900">{branch.mobile || "N/A"}</strong></span>
                            </div>
                            <div className="text-slate-600 font-semibold flex items-center gap-1.5 truncate">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">Email: <strong className="text-slate-900">{branch.email}</strong></span>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-2.5 text-center">
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Students</div>
                              <div className="text-sm font-black text-slate-900">{branchStudentsCount}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Teachers</div>
                              <div className="text-sm font-black text-slate-900">{branchTeachersCount}</div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setSelectedBranchId(branch.id);
                              setSubTab("Students" as any);
                            }}
                            className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                          >
                            <span>View Branch Data</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditSubCenter(branch)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                              title="Edit Branch Info"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {!isMain && (
                              <button
                                onClick={() => handleDeleteSubCenter(branch.id, branch.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Remove Branch"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ADD SUB-CENTER MODAL */}
              {showAddBranchModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                  <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Super Center Network
                        </span>
                        <h3 className="text-lg font-black text-slate-900 mt-1 font-display">
                          ➕ Create New Sub-Center Branch
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowAddBranchModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-2 text-lg font-bold rounded-xl"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddSubCenterSubmit} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Branch Center Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newBranchName}
                          onChange={(e) => setNewBranchName(e.target.value)}
                          placeholder="e.g., Genius Abacus - Downtown Branch"
                          className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Branch Manager / Head</label>
                          <input
                            type="text"
                            value={newBranchOwner}
                            onChange={(e) => setNewBranchOwner(e.target.value)}
                            placeholder="Full Name"
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number</label>
                          <input
                            type="tel"
                            value={newBranchMobile}
                            onChange={(e) => setNewBranchMobile(e.target.value)}
                            placeholder="+91 9876543210"
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                          <input
                            type="email"
                            value={newBranchEmail}
                            onChange={(e) => setNewBranchEmail(e.target.value)}
                            placeholder="branch@abacus.com"
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Login Password</label>
                          <input
                            type="text"
                            value={newBranchPassword}
                            onChange={(e) => setNewBranchPassword(e.target.value)}
                            placeholder="password123"
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                          <input
                            type="text"
                            value={newBranchCity}
                            onChange={(e) => setNewBranchCity(e.target.value)}
                            placeholder="City Name"
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">State</label>
                          <input
                            type="text"
                            value={newBranchState}
                            onChange={(e) => setNewBranchState(e.target.value)}
                            placeholder="State"
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Address</label>
                        <textarea
                          rows={2}
                          value={newBranchAddress}
                          onChange={(e) => setNewBranchAddress(e.target.value)}
                          placeholder="Full Street Address"
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold resize-none"
                        />
                      </div>

                      <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowAddBranchModal(false)}
                          className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={branchSubmitting}
                          className="px-6 py-2.5 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          {branchSubmitting ? "Adding Branch..." : "Create Sub-Center Branch"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* EDIT SUB-CENTER MODAL */}
              {editingBranch && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                  <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Edit Branch ({editingBranch.id})
                        </span>
                        <h3 className="text-lg font-black text-slate-900 mt-1 font-display">
                          ✏️ Edit Sub-Center Branch
                        </h3>
                      </div>
                      <button
                        onClick={() => setEditingBranch(null)}
                        className="text-slate-400 hover:text-slate-600 p-2 text-lg font-bold rounded-xl"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleEditSubCenterSubmit} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Branch Center Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editBranchName}
                          onChange={(e) => setEditBranchName(e.target.value)}
                          className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Branch Manager / Head</label>
                          <input
                            type="text"
                            value={editBranchOwner}
                            onChange={(e) => setEditBranchOwner(e.target.value)}
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number</label>
                          <input
                            type="tel"
                            value={editBranchMobile}
                            onChange={(e) => setEditBranchMobile(e.target.value)}
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                          <input
                            type="email"
                            value={editBranchEmail}
                            onChange={(e) => setEditBranchEmail(e.target.value)}
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Login Password</label>
                          <input
                            type="text"
                            value={editBranchPassword}
                            onChange={(e) => setEditBranchPassword(e.target.value)}
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                          <input
                            type="text"
                            value={editBranchCity}
                            onChange={(e) => setEditBranchCity(e.target.value)}
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">State</label>
                          <input
                            type="text"
                            value={editBranchState}
                            onChange={(e) => setEditBranchState(e.target.value)}
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingBranch(null)}
                          className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={branchSubmitting}
                          className="px-6 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          {branchSubmitting ? "Saving..." : "Save Branch Details"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CENTER ACTIVITY LOG SUB-TAB */}
          {subTab === "ActivityLog" && (
            <div className="space-y-6 animate-fade-in" id="center-activity-log-tab">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-base font-black text-slate-950 font-display">Franchise Branch Activity Log</h4>
                  <p className="text-xs text-slate-500 font-medium">Audit trail of all administrative and operations actions within this center.</p>
                </div>
                <button
                  onClick={onRefreshData}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                  <span>Refresh Logs</span>
                </button>
              </div>

              {/* Filtering Controls */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Filter by Date</label>
                  <input
                    type="date"
                    value={logFilterDate}
                    onChange={(e) => setLogFilterDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Filter by User</label>
                  <input
                    type="text"
                    placeholder="Search user name..."
                    value={logFilterUser}
                    onChange={(e) => setLogFilterUser(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Filter by Action</label>
                  <select
                    value={logFilterAction}
                    onChange={(e) => setLogFilterAction(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="">All Actions</option>
                    <option value="Student Creation">Student Creation</option>
                    <option value="Student Edit">Student Edit</option>
                    <option value="Student Delete">Student Delete</option>
                    <option value="Lead Creation">Lead Creation</option>
                    <option value="Lead Status Changes">Lead Status Changes</option>
                    <option value="Demo Scheduling">Demo Scheduling</option>
                    <option value="Demo Rescheduling">Demo Rescheduling</option>
                    <option value="Invoice Creation">Invoice Creation</option>
                    <option value="Invoice Edit">Invoice Edit</option>
                    <option value="Invoice Delete">Invoice Delete</option>
                    <option value="Invoice Paid">Invoice Paid</option>
                    <option value="Attendance Changes">Attendance Changes</option>
                    <option value="Homework Assignment">Homework Assignment</option>
                    <option value="Material Dispatch">Material Dispatch</option>
                  </select>
                </div>
                <div className="flex items-end justify-end">
                  <button
                    onClick={() => {
                      setLogFilterDate("");
                      setLogFilterUser("");
                      setLogFilterAction("");
                    }}
                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono uppercase tracking-wider">
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">User</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const userVal = logFilterUser.toLowerCase();

                        const filtered = activityLogs.filter(log => {
                          if (logFilterDate && log.date !== logFilterDate) return false;
                          if (userVal && !log.userName.toLowerCase().includes(userVal)) return false;
                          if (logFilterAction && log.action !== logFilterAction) return false;
                          return true;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold text-xs">
                                No matching activity logs found.
                              </td>
                            </tr>
                          );
                        }

                        // Sort logs descending by timestamp
                        const sortedLogs = [...filtered].sort((a, b) => b.id.localeCompare(a.id));

                        return sortedLogs.map((log: any) => {
                          let badgeStyle = "bg-slate-50 text-slate-600 border-slate-100";
                          if (log.action.includes("Creation")) badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                          else if (log.action.includes("Edit") || log.action.includes("Reschedule")) badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";
                          else if (log.action.includes("Delete")) badgeStyle = "bg-rose-50 text-rose-700 border-rose-100";
                          else if (log.action.includes("Paid")) badgeStyle = "bg-blue-50 text-blue-700 border-blue-100";

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-slate-400">
                                <span className="block font-bold text-slate-700">{log.date}</span>
                                <span className="text-[10px]">{log.time}</span>
                              </td>
                              <td className="p-3 font-extrabold text-slate-900">{log.userName}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700">
                                  {log.role}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${badgeStyle}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-slate-600 max-w-xs truncate" title={log.details}>
                                {log.details}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TIMING CHANGE APPROVALS SUB-TAB */}
          {subTab === "TimingApprovals" && (
            <div className="space-y-6 animate-fade-in" id="timing-approvals-tab">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-base font-black text-slate-950 font-display">Timing Change Approvals</h4>
                  <p className="text-xs text-slate-500 font-medium">Review, approve, or reject available timings adjustment requests submitted by center teachers.</p>
                </div>
                <button
                  onClick={onRefreshData}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Requests</span>
                </button>
              </div>

              {/* Pending Requests Section */}
              <div className="space-y-3">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Pending Approvals ({timingChangeRequests.filter(r => r.status === "Pending").length})
                </h5>

                {timingChangeRequests.filter(r => r.status === "Pending").length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl text-xs text-slate-400">
                    No pending timing change requests found for this center.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {timingChangeRequests
                      .filter(r => r.status === "Pending")
                      .map((req) => {
                        const teacher = initialTeachers.find(t => t.id === req.teacherId);
                        const currentSlots = teacher?.availableSlots || [];
                        const requestedSlots = req.requestedSlots || [];

                        // Calculate differences
                        const added = requestedSlots.filter(s => !currentSlots.includes(s));
                        const removed = currentSlots.filter(s => !requestedSlots.includes(s));
                        const unchanged = currentSlots.filter(s => requestedSlots.includes(s));

                        return (
                          <div key={req.id} className="border border-slate-200 bg-slate-50/20 rounded-2xl p-5 space-y-4 hover:border-slate-300 transition-all">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-extrabold text-indigo-950 text-sm">{teacher?.name || `Teacher (${req.teacherId})`}</div>
                                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                  ID: {req.teacherId} • {new Date(req.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                                Pending
                              </span>
                            </div>

                            <div className="space-y-2 text-xs bg-white border border-slate-100 rounded-xl p-3">
                              <div className="font-black text-[10px] text-slate-400 uppercase tracking-wider mb-2">Timing Comparison</div>
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
                                  <span className="text-[10px] text-slate-400 italic">Clear all slots request</span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3 pt-2">
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rejection Remarks (Required if rejecting)</label>
                                <input
                                  id={`admin-remark-${req.id}`}
                                  type="text"
                                  placeholder="e.g. Wednesday slot is fully booked already. Please propose another."
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                                />
                              </div>

                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const remarkVal = (document.getElementById(`admin-remark-${req.id}`) as HTMLInputElement)?.value.trim();
                                    if (!remarkVal) {
                                      alert("Please provide rejection remarks to guide the teacher!");
                                      return;
                                    }
                                    if (!confirm("Are you sure you want to reject this timing request?")) return;
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
                                        alert("Request rejected successfully.");
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
                                    if (!confirm("Are you sure you want to approve this request and update teacher's active timings?")) return;
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
                                        alert("Request approved and timings updated!");
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
                                  Approve & Sync
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Request Logs list */}
              <div className="border-t border-slate-100 pt-6 space-y-3">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span>Audit History of Timing Requests</span>
                </h5>

                <div className="overflow-x-auto border border-slate-150 rounded-2xl bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Teacher</th>
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
                          .map((req) => {
                            const teacher = initialTeachers.find(t => t.id === req.teacherId);
                            return (
                              <tr key={req.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">
                                  {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-4 py-3 font-extrabold text-indigo-950">
                                  {teacher?.name || `ID: ${req.teacherId}`}
                                </td>
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
                                    <span className="text-emerald-700 italic">Slots approved and synchronized</span>
                                  ) : (
                                    <span className="text-slate-400 italic">Awaiting decision</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM BACKUPS & RESTORE SUB-TAB */}
          {subTab === "Backups" && currentUser?.role === "Super Admin" && (
            <div className="space-y-6 animate-fade-in" id="system-backups-tab">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-base font-black text-slate-950 font-display">SaaS Disaster Recovery & Backups</h4>
                  <p className="text-xs text-slate-500 font-medium">Create custom snapshots, download databases, or restore historical recovery points with automated retention policy.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={backupType}
                    onChange={(e: any) => setBackupType(e.target.value as any)}
                    className="px-3 py-1.5 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="daily">Daily Backup (7-day Retention)</option>
                    <option value="weekly">Weekly Backup (4-week Retention)</option>
                    <option value="monthly">Monthly Backup (12-month Retention)</option>
                  </select>
                  <button
                    onClick={async () => {
                      setIsCreatingBackup(true);
                      try {
                        const res = await fetch("/api/erp/backups/create", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ type: backupType })
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert(`Snapshot created successfully: ${data.backup.id}`);
                          fetchBackups();
                        } else {
                          alert("Failed to create snapshot: " + data.error);
                        }
                      } catch (err: any) {
                        alert("Error: " + err.message);
                      } finally {
                        setIsCreatingBackup(false);
                      }
                    }}
                    disabled={isCreatingBackup}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-100 shrink-0 cursor-pointer disabled:opacity-55"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{isCreatingBackup ? "Creating..." : "Create On-Demand Backup"}</span>
                  </button>
                </div>
              </div>

              {/* Status banner */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">Automated System Retention Rules</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    The platform automatically executes daily backups on ERP data load. Pruning runs instantly: **Daily snapshots** are capped at the latest 7, **Weekly snapshots** are capped at the latest 4, and **Monthly snapshots** are capped at 12 to conform to strict SaaS compliance policies.
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-center">
                    <span className="block text-xs font-black text-slate-900">{backups.length}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Recovery Points</span>
                  </div>
                  <div className="h-8 w-px bg-slate-150"></div>
                  <div className="text-center">
                    <span className="block text-xs font-black text-emerald-600">Active</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
                  </div>
                </div>
              </div>

              {/* Backups List Table */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono uppercase tracking-wider">
                        <th className="p-3">Backup ID</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Created By</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {loadingBackups ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold text-xs">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                            <span>Loading backups from secure cloud store...</span>
                          </td>
                        </tr>
                      ) : backups.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold text-xs">
                            No active backups found in Firestore database.
                          </td>
                        </tr>
                      ) : (
                        backups.map((bk: any) => {
                          let typeBadge = "bg-sky-50 text-sky-700 border-sky-100";
                          if (bk.type === "weekly") typeBadge = "bg-purple-50 text-purple-700 border-purple-100";
                          if (bk.type === "monthly") typeBadge = "bg-pink-50 text-pink-700 border-pink-100";

                          return (
                            <tr key={bk.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-slate-800">{bk.id}</td>
                              <td className="p-3 text-slate-600">{new Date(bk.timestamp).toLocaleString()}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${typeBadge} uppercase`}>
                                  {bk.type}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500 font-mono text-[11px]">{bk.createdBy}</td>
                              <td className="p-3 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    window.open(`/api/erp/backups/download/${bk.id}`, '_blank');
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-black transition-all cursor-pointer inline-block"
                                >
                                  Download JSON
                                </button>
                                <button
                                  onClick={async () => {
                                    const confirmRestore = confirm(`WARNING: Restoring backup ${bk.id} will completely overwrite all current database tables and memory. Are you absolutely certain you want to proceed?`);
                                    if (!confirmRestore) return;
                                    
                                    try {
                                      const res = await fetch("/api/erp/backups/restore", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ backupId: bk.id })
                                      });
                                      const data = await res.json();
                                      if (data.success) {
                                        alert("Database recovery successful! Reloading platform dashboard.");
                                        window.location.reload();
                                      } else {
                                        alert("Restoration failed: " + data.error);
                                      }
                                    } catch (err: any) {
                                      alert("Error during restoration: " + err.message);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-black transition-all cursor-pointer inline-block"
                                >
                                  Safe Merge Restore
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DIGITAL CERTIFICATES SUB-TAB */}
          {subTab === "Certificates" && (
            <div className="space-y-6 animate-fade-in" id="digital-certificates-tab">
              <DigitalCertificateManager
                currentTeacher={{
                  id: loggedInInfo?.id || "ADMIN",
                  centerId: activeCenterId,
                  name: activeCenterOwner,
                  email: activeCenterEmail,
                  mobile: "",
                  joiningDate: "",
                  role: "Center Admin",
                  status: "Active"
                }}
                students={students}
                center={activeCenter}
                teachers={teachers}
                onRefreshData={async () => {
                  if (onRefreshData) onRefreshData();
                }}
              />
            </div>
          )}

      {/* MONTHLY FEE SCHEDULER MODAL */}
      {showSchedulerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-5xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-4 py-3.5 sm:px-6 sm:py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-black tracking-tight text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="truncate">Monthly Fee Scheduler</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider shrink-0">
                      Interactive Checklist
                    </span>
                  </h3>
                  <p className="hidden sm:block text-xs text-indigo-200/80 mt-0.5">
                    Review assigned billing cycles, edit fee amounts, and check tick marks before issuing batch student invoices.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSchedulerModal(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Filters & Control Toolbar */}
            <div className="p-3 sm:p-5 bg-slate-50/80 border-b border-slate-200 space-y-3 sm:space-y-4 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                
                {/* Target Month Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Billing Month:</span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                    <input
                      type="text"
                      value={schedulerTargetMonth}
                      onChange={(e) => handleTargetMonthChange(e.target.value)}
                      placeholder="e.g. August 2026"
                      className="px-2.5 py-1 sm:py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-44 shadow-xs"
                    />
                    <button
                      onClick={() => initializeSchedulerSelection(schedulerTargetMonth)}
                      className="p-1.5 sm:p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                      title="Refresh student fee status"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* Quick Select Checkbox Action Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSelectAll(true)}
                    className="flex-1 sm:flex-none justify-center px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Select All</span>
                  </button>
                  <button
                    onClick={() => handleToggleSelectAll(false)}
                    className="flex-1 sm:flex-none justify-center px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Unselect All</span>
                  </button>
                </div>
              </div>

              {/* Billing Cycle Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  <span>Cycle:</span>
                </span>
                {["All", "Monthly", "Quarterly", "Half-Yearly", "Yearly", "Level-wise"].map((freq) => {
                  const isActive = schedulerFreqFilter === freq;
                  return (
                    <button
                      key={freq}
                      onClick={() => setSchedulerFreqFilter(freq)}
                      className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {freq === "All" ? "All" : freq}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Body: Student Checklist Table & Mobile List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              {(() => {
                const activeCenterId = currentUser?.id || "C001";
                const filteredStudents = students.filter(s => {
                  const isActive = s.status === "Active" || !s.status;
                  const matchesCenter = activeCenterId ? (s.centerId === activeCenterId || s.centerId === "C001" || !s.centerId) : true;
                  if (!isActive || !matchesCenter) return false;
                  const freq = s.billingFrequency || s.billingType || "Monthly";
                  if (schedulerFreqFilter !== "All" && freq !== schedulerFreqFilter) return false;
                  return true;
                });

                if (filteredStudents.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 font-medium bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs">
                      No active students found for billing cycle "{schedulerFreqFilter}".
                    </div>
                  );
                }

                return (
                  <>
                    {/* Mobile Touch-Friendly Card View (Visible on Mobile) */}
                    <div className="block md:hidden space-y-2.5">
                      {filteredStudents.map((s) => {
                        const selection = schedulerSelectionMap[s.id] || {
                          checked: false,
                          amount: Number(s.monthlyFee) || 3000,
                          frequency: s.billingFrequency || "Monthly",
                          reason: "Pending",
                          feeType: "Level Fee"
                        };
                        const isChecked = selection.checked;
                        const freq = s.billingFrequency || s.billingType || "Monthly";

                        return (
                          <div
                            key={s.id}
                            onClick={() => handleToggleStudentChecked(s.id)}
                            className={`p-3 border rounded-2xl transition-all cursor-pointer ${
                              isChecked ? "bg-indigo-50/60 border-indigo-300 shadow-xs" : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleStudentChecked(s.id);
                                }}
                                className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer mt-0.5 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="font-bold text-slate-900 text-xs truncate">{s.studentName}</div>
                                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    freq === "Monthly" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                    freq === "Quarterly" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                                    freq === "Half-Yearly" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                    freq === "Yearly" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                    "bg-slate-100 text-slate-700 border border-slate-200"
                                  }`}>
                                    {freq}
                                  </span>
                                </div>
                                
                                <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                  <span className="font-mono text-slate-400">ID: {s.id}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-700">Lvl {s.level || 1}</span>
                                  <span>•</span>
                                  <span className="truncate max-w-[120px]">{s.batch || "Auto"}</span>
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-slate-400">Fee:</span>
                                    <div className="relative w-24">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                      <input
                                        type="number"
                                        value={selection.amount}
                                        onChange={(e) => handleStudentAmountChange(s.id, Number(e.target.value) || 0)}
                                        className="w-full pl-5 pr-1.5 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    {selection.reason.startsWith("Due") ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                                        <span>Due</span>
                                      </span>
                                    ) : selection.reason.startsWith("Already Paid") ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                        <span>Paid</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>{selection.reason}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table View (Visible on Medium+ Screens) */}
                    <div className="hidden md:block border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] uppercase tracking-wider font-black text-slate-500">
                            <th className="py-3 px-4 w-12 text-center">
                              <span>Select</span>
                            </th>
                            <th className="py-3 px-4">Student & Details</th>
                            <th className="py-3 px-4">Billing Cycle</th>
                            <th className="py-3 px-4">Target Fee Amount (₹)</th>
                            <th className="py-3 px-4">Invoice Status for {schedulerTargetMonth}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {filteredStudents.map((s) => {
                            const selection = schedulerSelectionMap[s.id] || {
                              checked: false,
                              amount: Number(s.monthlyFee) || 3000,
                              frequency: s.billingFrequency || "Monthly",
                              reason: "Pending",
                              feeType: "Level Fee"
                            };
                            const isChecked = selection.checked;
                            const freq = s.billingFrequency || s.billingType || "Monthly";

                            return (
                              <tr
                                key={s.id}
                                className={`transition-colors hover:bg-slate-50/80 ${
                                  isChecked ? "bg-indigo-50/30" : ""
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="py-3 px-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleStudentChecked(s.id)}
                                    className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                  />
                                </td>

                                {/* Student Info */}
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">{s.studentName}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span>ID: {s.id}</span>
                                    <span>•</span>
                                    <span>Level {s.level || 1}</span>
                                    <span>•</span>
                                    <span>Batch: {s.batch || "Auto"}</span>
                                  </div>
                                </td>

                                {/* Billing Cycle Badge */}
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    freq === "Monthly" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                    freq === "Quarterly" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                                    freq === "Half-Yearly" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                    freq === "Yearly" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                    "bg-slate-100 text-slate-700 border border-slate-200"
                                  }`}>
                                    {freq}
                                  </span>
                                </td>

                                {/* Editable Fee Amount */}
                                <td className="py-3 px-4">
                                  <div className="relative w-32">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                    <input
                                      type="number"
                                      value={selection.amount}
                                      onChange={(e) => handleStudentAmountChange(s.id, Number(e.target.value) || 0)}
                                      className="w-full pl-6 pr-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                    />
                                  </div>
                                </td>

                                {/* Status Reason */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    {selection.reason.startsWith("Due") ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                                        <span>Due for New Invoice</span>
                                      </span>
                                    ) : selection.reason.startsWith("Already Paid") ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                        <span>{selection.reason}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>{selection.reason}</span>
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
                <div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-wider">Checked</div>
                  <div className="text-sm sm:text-lg font-black text-white font-mono">
                    {(() => {
                      const activeCenterId = currentUser?.id || "C001";
                      const filteredStudents = students.filter(s => {
                        const isActive = s.status === "Active" || !s.status;
                        const matchesCenter = activeCenterId ? (s.centerId === activeCenterId || s.centerId === "C001" || !s.centerId) : true;
                        if (!isActive || !matchesCenter) return false;
                        const freq = s.billingFrequency || s.billingType || "Monthly";
                        if (schedulerFreqFilter !== "All" && freq !== schedulerFreqFilter) return false;
                        return true;
                      });
                      const checkedCount = filteredStudents.filter(s => schedulerSelectionMap[s.id]?.checked).length;
                      return `${checkedCount} / ${filteredStudents.length}`;
                    })()}
                  </div>
                </div>

                <div className="h-6 sm:h-8 w-px bg-slate-800" />

                <div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-wider">Batch Amount</div>
                  <div className="text-base sm:text-xl font-black text-emerald-400 font-mono">
                    ₹{(() => {
                      const activeCenterId = currentUser?.id || "C001";
                      const filteredStudents = students.filter(s => {
                        const isActive = s.status === "Active" || !s.status;
                        const matchesCenter = activeCenterId ? (s.centerId === activeCenterId || s.centerId === "C001" || !s.centerId) : true;
                        if (!isActive || !matchesCenter) return false;
                        const freq = s.billingFrequency || s.billingType || "Monthly";
                        if (schedulerFreqFilter !== "All" && freq !== schedulerFreqFilter) return false;
                        return true;
                      });
                      const sum = filteredStudents.reduce((tot, s) => {
                        const sel = schedulerSelectionMap[s.id];
                        return sel && sel.checked ? tot + Number(sel.amount || 0) : tot;
                      }, 0);
                      return sum.toLocaleString('en-IN');
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTriggerFeeAssignment()}
                  disabled={triggeringFeeCheck}
                  className="flex-1 sm:flex-none justify-center px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 cursor-pointer flex items-center gap-1.5"
                  title="Run background automated rule check"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${triggeringFeeCheck ? 'animate-spin' : ''}`} />
                  <span className="truncate">Auto-Check</span>
                </button>

                <button
                  type="button"
                  onClick={handleBatchIssueInvoices}
                  disabled={isBatchIssuing}
                  className="flex-1 sm:flex-none justify-center px-3.5 py-2 sm:px-5 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
                  <span className="truncate">{isBatchIssuing ? "Generating..." : "Generate Invoices"}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

        </div>
      </div>

    </div>
  );
}
