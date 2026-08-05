import React, { useState, useEffect } from "react";
import { 
  Download, FileText, FileSpreadsheet, Printer, Shield, 
  Lock, AlertTriangle, ListFilter, ClipboardList, Info
} from "lucide-react";
import { 
  AccountingIncome, AccountingExpense, AccountingRecurring, 
  AccountingAuditTrail, Center, Teacher, Student, FeeRecord 
} from "../types";
import { AccountingDashboard } from "./AccountingDashboard";
import { AccountingLedger } from "./AccountingLedger";
import { AccountingReports } from "./AccountingReports";
import { BalanceSheetAndHealth } from "./BalanceSheetAndHealth";

interface Props {
  currentUser: {
    email: string;
    name: string;
    role: string;
    centerId?: string | null;
  };
  centers: Center[];
  teachers: Teacher[];
  students: Student[];
  fees: FeeRecord[];
  onRefreshData: () => Promise<void>;
}

export const AccountingView: React.FC<Props> = ({
  currentUser,
  centers,
  teachers,
  students,
  fees,
  onRefreshData
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"Dashboard" | "BalanceSheet" | "Ledger" | "Reports" | "Audit">("Dashboard");
  
  const userRole = currentUser.role;
  const isTeacher = userRole === "Teacher" || userRole === "Manager + Teacher";
  
  // Data State
  const [incomes, setIncomes] = useState<AccountingIncome[]>([]);
  const [expenses, setExpenses] = useState<AccountingExpense[]>([]);
  const [recurring, setRecurring] = useState<AccountingRecurring[]>([]);
  const [auditTrails, setAuditTrails] = useState<AccountingAuditTrail[]>([]);
  const [saasInvoices, setSaasInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Data
  const loadFinancials = async (silent = false) => {
    const hasData = incomes.length > 0 || expenses.length > 0 || recurring.length > 0;
    if (!silent && !hasData) {
      setLoading(true);
    }
    try {
      const response = await fetch("/api/erp/data", {
        headers: {
          "x-logged-in-user-email": currentUser.email
        }
      });
      const result = await response.json();
      if (result.success && result.data) {
        setIncomes(result.data.accountingIncomes || []);
        setExpenses(result.data.accountingExpenses || []);
        setRecurring(result.data.accountingRecurring || []);
        setAuditTrails(result.data.accountingAuditTrails || []);
        setSaasInvoices(result.data.saasInvoices || []);
      }
    } catch (err) {
      console.error("Failed to load financials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancials(false);
  }, [currentUser?.email, currentUser?.role, currentUser?.centerId]);

  // Map collected student fees (status: "Paid") into standard read-only System Incomes
  const feeIncomes = React.useMemo<AccountingIncome[]>(() => {
    if (userRole === "Super Admin") return [];
    return fees
      .filter(f => f.status === "Paid")
      .map(f => {
        const student = students.find(s => s.id === f.studentId);
        const sName = student ? student.studentName : `Student (ID: ${f.studentId})`;
        return {
          id: f.id,
          centerId: f.centerId,
          date: f.paidDate || f.dueDate || new Date().toISOString().split("T")[0],
          studentName: sName,
          category: (f.feeType || "Course Fee") as any,
          amount: f.amount,
          paymentMode: (f.paymentMethod || "UPI") as any,
          receiptNumber: f.referenceNumber || `FEE-${f.id}`,
          notes: f.feedback || "Collected Student Fee Payment",
          createdBy: "System",
          createdAt: f.paidDate || new Date().toISOString()
        };
      });
  }, [fees, students, userRole]);

  // Map SaaS Invoices (status: "Paid") into standard read-only System Incomes for Super Admin
  const saasSubscriptionIncomes = React.useMemo<AccountingIncome[]>(() => {
    if (userRole !== "Super Admin") return [];
    return saasInvoices
      .filter(si => si.status === "Paid")
      .map(si => ({
        id: si.id,
        centerId: "SUPER",
        date: si.paidDate || si.issuedDate || new Date().toISOString().split("T")[0],
        studentName: si.centerName || `Center ID: ${si.centerId}`, // Used as the Customer Name
        category: "Center Subscription Income",
        amount: si.amount,
        paymentMode: (si.paymentMode || "UPI Transfer") as any,
        receiptNumber: si.referenceId || `SAAS-${si.id}`,
        notes: `Paid subscription: ${si.planName}`,
        createdBy: "System",
        createdAt: si.paidDate || new Date().toISOString()
      }));
  }, [saasInvoices, userRole]);

  // Combine manual ledger incomes and synchronized collected fee/SaaS incomes
  const combinedIncomes = React.useMemo<AccountingIncome[]>(() => {
    if (userRole === "Super Admin") {
      const corporateManualIncomes = incomes.filter(i => i.centerId === "SUPER");
      return [...saasSubscriptionIncomes, ...corporateManualIncomes];
    } else {
      const centerManualIncomes = incomes.filter(i => i.centerId === currentUser.centerId && !i.id.startsWith("FEE_INC_"));
      const centerFeeIncomes = feeIncomes.filter(f => f.centerId === currentUser.centerId);
      return [...centerFeeIncomes, ...centerManualIncomes];
    }
  }, [userRole, incomes, saasSubscriptionIncomes, feeIncomes, currentUser.centerId]);

  // Expand recurring manual expenses according to their frequency
  const expandedExpenses = React.useMemo<AccountingExpense[]>(() => {
    const expanded: AccountingExpense[] = [];
    expenses.forEach(e => {
      const freq = e.frequency || "One-time payment";
      if (freq === "One-time payment") {
        expanded.push(e);
        return;
      }

      // Generate occurrences for 2025, 2026, and 2027
      const startDate = new Date(e.date);
      if (isNaN(startDate.getTime())) {
        expanded.push(e);
        return;
      }
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth(); // 0-11
      const startDay = startDate.getDate();

      for (let year of [2025, 2026, 2027]) {
        for (let m = 0; m < 12; m++) {
          const tempDate = new Date(year, m, startDay);
          // Clamp day of month if overflow occurs (e.g. 31st of April becomes 30th)
          if (tempDate.getMonth() !== m) {
            tempDate.setDate(0);
          }

          if (tempDate < startDate) {
            continue;
          }

          let shouldInclude = false;
          const monthDiff = (year - startYear) * 12 + (m - startMonth);
          if (freq === "Monthly") {
            shouldInclude = true;
          } else if (freq === "Quarterly") {
            if (monthDiff >= 0 && monthDiff % 3 === 0) {
              shouldInclude = true;
            }
          } else if (freq === "Half-Yearly") {
            if (monthDiff >= 0 && monthDiff % 6 === 0) {
              shouldInclude = true;
            }
          } else if (freq === "Yearly") {
            if (monthDiff >= 0 && monthDiff % 12 === 0) {
              shouldInclude = true;
            }
          }

          if (shouldInclude) {
            const dateStr = tempDate.toISOString().split("T")[0];
            expanded.push({
              ...e,
              id: `${e.id}_occ_${year}_${m}`,
              date: dateStr,
              notes: `${e.notes} (Recurring occurrence - ${freq})`.trim()
            });
          }
        }
      }
    });
    return expanded;
  }, [expenses]);

  const combinedExpenses = React.useMemo<AccountingExpense[]>(() => {
    if (userRole === "Super Admin") {
      return expandedExpenses.filter(e => e.centerId === "SUPER");
    } else {
      return expandedExpenses.filter(e => e.centerId === currentUser.centerId);
    }
  }, [expandedExpenses, userRole, currentUser.centerId]);

  // Helper to determine Indian Financial Year (starts April 1st, ends March 31st)
  const getFinancialYear = React.useCallback((dateStr: string): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "2026-27"; // Default fallback
    const year = d.getFullYear();
    const month = d.getMonth(); // 0 = January, 3 = April
    if (month >= 3) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  }, []);

  const currentFY = React.useMemo(() => {
    return getFinancialYear(new Date().toISOString().split("T")[0]);
  }, [getFinancialYear]);

  const [selectedYear, setSelectedYear] = useState<string>(currentFY);

  // Filter incomes and expenses by financial year
  const yearFilteredIncomes = React.useMemo(() => {
    if (selectedYear === "ALL") return combinedIncomes;
    return combinedIncomes.filter(i => getFinancialYear(i.date) === selectedYear);
  }, [combinedIncomes, selectedYear, getFinancialYear]);

  const yearFilteredExpenses = React.useMemo(() => {
    if (selectedYear === "ALL") return combinedExpenses;
    return combinedExpenses.filter(e => getFinancialYear(e.date) === selectedYear);
  }, [combinedExpenses, selectedYear, getFinancialYear]);

  const combinedRecurring = React.useMemo<AccountingRecurring[]>(() => {
    if (userRole === "Super Admin") {
      return recurring.filter(r => r.centerId === "SUPER");
    } else {
      return recurring.filter(r => r.centerId === currentUser.centerId);
    }
  }, [recurring, userRole, currentUser.centerId]);

  // Handle operations via fetch API
  const handleAddIncome = async (data: Partial<AccountingIncome>) => {
    try {
      const res = await fetch("/api/erp/accounting/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-logged-in-user-email": currentUser.email
        },
        body: JSON.stringify({ action: "add", data })
      });
      if (res.ok) {
        await loadFinancials(true);
        await onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditIncome = async (id: string, data: Partial<AccountingIncome>) => {
    try {
      const res = await fetch("/api/erp/accounting/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-logged-in-user-email": currentUser.email
        },
        body: JSON.stringify({ action: "edit", id, data })
      });
      if (res.ok) {
        await loadFinancials(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this income record?")) return;
    try {
      const res = await fetch("/api/erp/accounting/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-logged-in-user-email": currentUser.email
        },
        body: JSON.stringify({ action: "delete", id })
      });
      if (res.ok) {
        await loadFinancials(true);
        await onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddExpense = async (data: Partial<AccountingExpense>) => {
    try {
      const res = await fetch("/api/erp/accounting/expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-logged-in-user-email": currentUser.email
        },
        body: JSON.stringify({ action: "add", data })
      });
      if (res.ok) {
        await loadFinancials(true);
        await onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditExpense = async (id: string, data: Partial<AccountingExpense>) => {
    try {
      const res = await fetch("/api/erp/accounting/expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-logged-in-user-email": currentUser.email
        },
        body: JSON.stringify({ action: "edit", id, data })
      });
      if (res.ok) {
        await loadFinancials(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    try {
      const res = await fetch("/api/erp/accounting/expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-logged-in-user-email": currentUser.email
        },
        body: JSON.stringify({ action: "delete", id })
      });
      if (res.ok) {
        await loadFinancials(true);
        await onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProcessRecurring = async (id: string) => {
    try {
      const res = await fetch("/api/erp/accounting/recurring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-logged-in-user-email": currentUser.email
        },
        body: JSON.stringify({ action: "process_due", id })
      });
      if (res.ok) {
        alert("Recurring contract settled! Transaction logged.");
        await loadFinancials(true);
        await onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunTests = async () => {
    const res = await fetch("/api/erp/accounting/test-setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-logged-in-user-email": currentUser.email
      }
    });
    const result = await res.json();
    if (result.success) {
      // Reload db changes after test population
      await loadFinancials(true);
      return result.results;
    }
    return [];
  };

  // EXPORT UTILITIES (Part 10)
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return alert("No data available to export.");
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = (data: any[], filename: string) => {
    if (data.length === 0) return alert("No data available to export.");
    const headers = Object.keys(data[0]).join("\t");
    const rows = data.map(row => 
      Object.values(row).map(val => String(val).replace(/\t/g, " ")).join("\t")
    );
    const excelContent = "data:application/vnd.ms-excel;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(excelContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    const totalIncome = yearFilteredIncomes.reduce((s, i) => s + i.amount, 0);
    const totalExpense = yearFilteredExpenses.reduce((s, e) => s + e.amount, 0);
    const profit = totalIncome - totalExpense;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Academy Ledger Statement</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 25px; color: #333; }
            h2 { color: #111; margin-bottom: 2px; }
            p { margin-top: 0; color: #666; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; }
            th, td { border-bottom: 1px solid #eee; padding: 12px 10px; text-align: left; font-size: 12px; }
            th { text-transform: uppercase; font-size: 10px; color: #888; font-weight: bold; background: #fafafa; }
            .right { text-align: right; }
            .summary { margin-top: 30px; display: flex; justify-content: flex-end; gap: 40px; font-size: 13px; font-weight: bold; }
            .green { color: #10b981; }
            .red { color: #ef4444; }
          </style>
        </head>
        <body>
          <h2>PROFESSIONAL LEDGER RECONCILIATION</h2>
          <p>Generated on ${new Date().toLocaleDateString()} for center ledger isolated.</p>
          
          <h3>Income Stream Logs</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Source Student</th>
                <th>Category</th>
                <th>Receipt ID</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${yearFilteredIncomes.map(item => `
                <tr>
                  <td>${item.date}</td>
                  <td>${item.studentName || 'Manual Entry'}</td>
                  <td>${item.category}</td>
                  <td>${item.receiptNumber}</td>
                  <td class="right green">+₹${item.amount.toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <h3>Expense Voucher Logs</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Recipient Vendor</th>
                <th>Category</th>
                <th>Invoice ID</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${yearFilteredExpenses.map(item => `
                <tr>
                  <td>${item.date}</td>
                  <td>${item.vendorName}</td>
                  <td>${item.category}</td>
                  <td>${item.invoiceNumber}</td>
                  <td class="right red">-₹${item.amount.toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="summary">
            <div>REVENUES: <span class="green">₹${totalIncome.toLocaleString()}</span></div>
            <div>EXPENSES: <span class="red">₹${totalExpense.toLocaleString()}</span></div>
            <div>NET POSITION: <span class="${profit >= 0 ? 'green' : 'red'}">₹${profit.toLocaleString()}</span></div>
          </div>
        </body>
      </html>
    `;

    // Try popup window first, fallback to iframe print
    try {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent + `<script>window.onload = function() { window.print(); }</script>`);
        printWindow.document.close();
        return;
      }
    } catch (e) {
      console.warn("Popup blocked, using hidden iframe print fallback:", e);
    }

    // Dynamic Iframe Print Fallback
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 1500);
      }, 300);
    }
  };

  // 13. SECURITY LEVEL BLOCKERS
  if (isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 text-center text-xs max-w-xl mx-auto">
        <Lock className="w-12 h-12 text-rose-500 mb-3 animate-bounce" />
        <h4 className="text-sm font-bold text-slate-800">Accounting Security - Access Blocked</h4>
        <p className="text-slate-500 mt-2">
          Your role (<b>{userRole}</b>) is strictly authorized to academic worksheets and student schedules only. You do not have permission to view or modify general school ledgers.
        </p>
        <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-rose-800 font-mono mt-4">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>SECURITY LEVEL: BLOCKED_FINANCIAL_PRIVILEGES</span>
        </div>
      </div>
    );
  }

  // Outstanding Asset Calculations
  const outstandingFeesValue = userRole === "Super Admin" 
    ? 0 
    : fees.filter(f => f.status === "Unpaid" && f.centerId === currentUser.centerId).reduce((s, f) => s + f.amount, 0);

  const outstandingCenterSubsValue = userRole === "Super Admin" 
    ? saasInvoices.filter(si => si.status === "Unpaid" || si.status === "Overdue").reduce((s, si) => s + si.amount, 0)
    : 0;

  return (
    <div className="space-y-6">

      {/* Strong Secure Data Protection Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-emerald-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold leading-tight">Strong Financial Data Protection Active</h4>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              {userRole === "Super Admin" 
                ? "Super Admin corporate/SaaS billing accounting is strictly isolated. Individual center-level accounting remains private and inaccessible." 
                : `Center accounting ledger is strictly private. No financial details are shared with other franchise centers or Super Admins.`}
            </p>
          </div>
        </div>
        <span className="bg-emerald-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Isolated Environment
        </span>
      </div>
      
      {/* Top Banner Toolbar & Tabs Navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500 text-white text-[9px] font-black font-mono px-2 py-0.5 rounded uppercase">SYSTEM LEVEL ACTIVE</span>
            <span className="text-[10px] text-indigo-300 font-mono">User: {currentUser.email} ({currentUser.role})</span>
          </div>
          <h2 className="text-lg font-black font-display mt-1">PROFESSIONAL ACCOUNTING TERMINAL</h2>
          <p className="text-xs text-slate-400 mt-0.5">Dual-Ledger reconciliation ledger synced instantly with Google Firestore cluster.</p>
        </div>

        {/* Global Action Exports Button Dropdown */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => downloadCSV(yearFilteredIncomes, `income_ledger_FY${selectedYear}.csv`)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 font-bold text-[10px] px-3.5 py-2.5 rounded-xl border border-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => downloadExcel(yearFilteredExpenses, `expenses_ledger_FY${selectedYear}.xls`)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 font-bold text-[10px] px-3.5 py-2.5 rounded-xl border border-slate-700 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={printReport}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3.5 py-2.5 rounded-xl border border-indigo-500 cursor-pointer shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* 💡 SIMPLE ACCOUNTING YEAR EXPLAINER & DYNAMIC SELECTOR */}
      <div className="bg-amber-50/60 border border-amber-200/50 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm" id="fy-selection-bar">
        <div className="flex gap-3 items-start">
          <div className="bg-amber-500/10 text-amber-700 p-2.5 rounded-2xl shrink-0">
            <Info className="w-5 h-5 text-amber-600 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
              <span>Financial Year (FY) Active Filter:</span>
              <span className="bg-amber-600 text-white font-mono text-[10px] px-2.5 py-0.5 rounded-full font-black">
                {selectedYear === "ALL" ? "All History" : `FY 20${selectedYear}`}
              </span>
            </h4>
            <p className="text-xs text-amber-800/80 mt-1 max-w-2xl leading-relaxed">
              <strong>💡 School Owner Guide:</strong> Money is counted in "Financial Years" from <strong>April 1st to March 31st</strong> of the next year. On 1st April, all fees, salaries, and expenses restart at ₹0. Set your year dropdown to switch between years and see dynamic performance instantly!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm shrink-0 w-full md:w-auto justify-between md:justify-start">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Accounting Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-black text-indigo-700 focus:outline-none bg-transparent cursor-pointer ml-1 pr-2"
          >
            <option value="2025-26">FY 2025-26 (Till 31st Mar 2026)</option>
            <option value="2026-27">FY 2026-27 (Current: 1st Apr 2026 - 31st Mar 2027)</option>
            <option value="2027-28">FY 2027-28 (Next: 1st Apr 2027 - 31st Mar 2028)</option>
            <option value="ALL">Show All Ledger Entries</option>
          </select>
        </div>
      </div>

      {/* Main Tab Controller Bar */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit" id="accounting-main-tabs">
        <button
          onClick={() => setActiveTab("Dashboard")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Dashboard" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Accounting Dashboard
        </button>
        <button
          onClick={() => setActiveTab("BalanceSheet")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "BalanceSheet" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Balance Sheet & Health
        </button>
        <button
          onClick={() => setActiveTab("Ledger")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Ledger" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Double-Entry Ledger
        </button>
        <button
          onClick={() => setActiveTab("Reports")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Reports" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Reports & Profitability
        </button>
        <button
          onClick={() => setActiveTab("Audit")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Audit" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* Rendering Sub-panels */}
      {loading ? (
         <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border rounded-3xl border-slate-100">
           <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-3" />
           <span className="text-xs font-bold text-slate-600">Reconciling Firestore records ledger...</span>
         </div>
      ) : (
         <div className="space-y-6">
           {activeTab === "Dashboard" && (
             <AccountingDashboard
               incomes={yearFilteredIncomes}
               expenses={yearFilteredExpenses}
               recurring={combinedRecurring}
               outstandingFees={outstandingFeesValue}
               outstandingCenterSubs={outstandingCenterSubsValue}
               onProcessRecurring={handleProcessRecurring}
               onRunTests={handleRunTests}
               userRole={userRole}
               centers={centers}
               teachers={teachers}
               students={students}
               fees={fees}
               onRefreshData={async () => {
                 await onRefreshData();
                 await loadFinancials(true);
               }}
               currentUserEmail={currentUser.email}
             />
           )}

           {activeTab === "BalanceSheet" && (
             <BalanceSheetAndHealth
               incomes={yearFilteredIncomes}
               expenses={yearFilteredExpenses}
               recurring={combinedRecurring}
               centers={centers}
               teachers={teachers}
               students={students}
               fees={fees}
               saasInvoices={saasInvoices}
               userRole={userRole}
             />
           )}

           {activeTab === "Ledger" && (
             <AccountingLedger
               incomes={yearFilteredIncomes}
               expenses={yearFilteredExpenses}
               onAddIncome={handleAddIncome}
               onEditIncome={handleEditIncome}
               onDeleteIncome={handleDeleteIncome}
               onAddExpense={handleAddExpense}
               onEditExpense={handleEditExpense}
               onDeleteExpense={handleDeleteExpense}
               userRole={userRole}
             />
           )}

           {activeTab === "Reports" && (
             <AccountingReports
               incomes={yearFilteredIncomes}
               expenses={yearFilteredExpenses}
               centers={centers}
               teachers={teachers}
               students={students}
               userRole={userRole}
               currentUser={currentUser}
             />
           )}

          {activeTab === "Audit" && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-indigo-500" />
                    Security Ledger Audit Logs ({auditTrails.length})
                  </h4>
                  <p className="text-xs text-slate-400">Strict chronological registry of all database CRUD alterations (Compliance mandated).</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b font-mono text-[10px] text-slate-400 uppercase font-black">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Operator</th>
                      <th className="p-3">Operation</th>
                      <th className="p-3">Collection</th>
                      <th className="p-3">Entity ID</th>
                      <th className="p-3">Alteration Log details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {auditTrails.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">No security logs recorded in this period.</td>
                      </tr>
                    ) : (
                      auditTrails.map((trail) => {
                        let actionColor = "bg-slate-100 text-slate-700";
                        if (trail.action === "Create") actionColor = "bg-emerald-100 text-emerald-800";
                        if (trail.action === "Edit") actionColor = "bg-indigo-100 text-indigo-800";
                        if (trail.action === "Delete") actionColor = "bg-rose-100 text-rose-800";
                        return (
                          <tr key={trail.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{new Date(trail.timestamp).toLocaleString()}</td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{trail.userName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{trail.userEmail}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`font-bold font-mono text-[9px] px-2 py-0.5 rounded-full ${actionColor}`}>
                                {trail.action}
                              </span>
                            </td>
                            <td className="p-3 font-bold font-mono text-slate-500">{trail.entityType}</td>
                            <td className="p-3 font-mono text-[10px] text-slate-400">{trail.entityId}</td>
                            <td className="p-3 text-slate-600 italic max-w-md">{trail.details}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
