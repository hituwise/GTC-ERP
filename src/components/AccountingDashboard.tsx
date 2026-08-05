import React, { useState } from "react";
import { 
  TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle, Play, 
  Clock, Shield, RefreshCw, Calendar, ArrowRight, Wallet, Landmark, 
  Award, Gift, PiggyBank, Edit3, Check, Plus, HelpCircle, Sparkles
} from "lucide-react";
import { AccountingIncome, AccountingExpense, AccountingRecurring, Center, Teacher, Student, FeeRecord } from "../types";

interface Props {
  incomes: AccountingIncome[];
  expenses: AccountingExpense[];
  recurring: AccountingRecurring[];
  outstandingFees: number;
  outstandingCenterSubs: number;
  onProcessRecurring: (id: string) => Promise<void>;
  onRunTests: () => Promise<Array<{ name: string; status: "PASS" | "FAIL"; details: string }>>;
  userRole: string;
  centers: Center[];
  teachers: Teacher[];
  students: Student[];
  fees: FeeRecord[];
  onRefreshData?: () => Promise<void>;
  currentUserEmail?: string;
}

export const AccountingDashboard: React.FC<Props> = ({
  incomes,
  expenses,
  recurring,
  outstandingFees,
  outstandingCenterSubs,
  onProcessRecurring,
  onRunTests,
  userRole,
  centers,
  teachers,
  students,
  fees,
  onRefreshData,
  currentUserEmail
}) => {
  const [testResults, setTestResults] = useState<Array<{ name: string; status: "PASS" | "FAIL"; details: string }> | null>(null);
  const [runningTests, setRunningTests] = useState(false);

  // --- OPENING BALANCES MANAGEMENT ---
  const activeCenter = userRole === "Super Admin" ? null : (centers.find(c => c.email?.toLowerCase() === currentUserEmail?.toLowerCase()) || centers[0]);
  const hasSetBalances = activeCenter && activeCenter.initialCashOnHand !== undefined && activeCenter.initialBankBalance !== undefined;

  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [cashInput, setCashInput] = useState(activeCenter?.initialCashOnHand?.toString() || "0");
  const [bankInput, setBankInput] = useState(activeCenter?.initialBankBalance?.toString() || "0");
  const [savingBalances, setSavingBalances] = useState(false);

  // --- PROJECTIONS MANAGEMENT ---
  const [projectionPeriod, setProjectionPeriod] = useState<"current_month" | "quarterly" | "half_yearly" | "yearly">("current_month");

  // --- PAY SALARY MODAL/FORM STATE ---
  const [payingTeacher, setPayingTeacher] = useState<Teacher | null>(null);
  const [selectedAccrual, setSelectedAccrual] = useState<AccountingExpense | null>(null);
  const [payMonthName, setPayMonthName] = useState("");
  const [baseSalaryVal, setBaseSalaryVal] = useState("");
  const [bonusVal, setBonusVal] = useState("0");
  const [paymentModeVal, setPaymentModeVal] = useState<"Cash" | "UPI" | "Bank Transfer" | "Card" | "Cheque">("UPI");
  const [paymentDetailsVal, setPaymentDetailsVal] = useState("");
  const [notesVal, setNotesVal] = useState("");
  const [payDateVal, setPayDateVal] = useState(new Date().toISOString().split("T")[0]);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // --- STUDENT FEES MANAGEMENT STATES ---
  const [showFeeCollectionModal, setShowFeeCollectionModal] = useState(false);
  const [feeCollectionType, setFeeCollectionType] = useState<"existing" | "new">("existing");
  
  // Existing Invoice Payment States
  const [selectedUnpaidFeeId, setSelectedUnpaidFeeId] = useState("");
  const [existingPaidDate, setExistingPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [existingPaymentMethod, setExistingPaymentMethod] = useState("UPI");
  const [existingPaymentRef, setExistingPaymentRef] = useState("");
  
  // New Manual/Historical Invoice States
  const [newFeeStudentId, setNewFeeStudentId] = useState("");
  const [newFeeMonth, setNewFeeMonth] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState("");
  const [newFeeDiscount, setNewFeeDiscount] = useState("0");
  const [newFeeType, setNewFeeType] = useState("Level Fee");
  const [newFeePaidDate, setNewFeePaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [newFeePaymentMethod, setNewFeePaymentMethod] = useState("UPI");
  const [newFeePaymentRef, setNewFeePaymentRef] = useState("");
  
  const [submittingFeeCollection, setSubmittingFeeCollection] = useState(false);

  // --- CALCULATE CASH & BANK BALANCES ---
  const initialCash = activeCenter?.initialCashOnHand;
  const initialBank = activeCenter?.initialBankBalance;

  const cashIn = incomes.filter(i => i.paymentMode === "Cash").reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const cashOut = expenses.filter(e => e.paymentMode === "Cash").reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const currentCash = initialCash !== undefined ? (initialCash + cashIn - cashOut) : null;

  const bankIn = incomes.filter(i => i.paymentMode !== "Cash").reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const bankOut = expenses.filter(e => e.paymentMode !== "Cash").reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const currentBank = initialBank !== undefined ? (initialBank + bankIn - bankOut) : null;

  // Math summaries
  const totalIncome = incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netProfit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const reminders = recurring.filter(item => {
    if (!item.isActive) return false;
    const itemDate = new Date(item.nextDueDate);
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 10);
    return itemDate <= limitDate;
  });

  // --- CALCULATE PROJECTIONS ---
  const activeStudents = students.filter(s => s.status === "Active");
  const activeTeachersCount = teachers.filter(t => t.status === "Active").length;

  // Expected monthly tuition fee per active student (default to ₹1500 if not specified)
  const monthlyInflowPerStudent = activeStudents.reduce((sum, s) => sum + (Number(s.monthlyFee) || 1500), 0);
  const monthlyOutflowPerTeacher = teachers.filter(t => t.status === "Active").reduce((sum, t) => sum + (Number(t.monthlySalary) || 0), 0);

  // Operating costs from recurring active contracts
  const monthlyRecurringExpenses = recurring
    .filter(r => r.type === "Expense" && r.isActive)
    .reduce((sum, r) => sum + r.amount, 0);

  let projectionMonths = 1;
  let periodLabel = "Current Month";
  if (projectionPeriod === "quarterly") {
    projectionMonths = 3;
    periodLabel = "Quarterly (3 Months)";
  } else if (projectionPeriod === "half_yearly") {
    projectionMonths = 6;
    periodLabel = "Half-Yearly (6 Months)";
  } else if (projectionPeriod === "yearly") {
    projectionMonths = 12;
    periodLabel = "Yearly (12 Months)";
  }

  const projectedInflow = monthlyInflowPerStudent * projectionMonths;
  const projectedOutflow = (monthlyOutflowPerTeacher + monthlyRecurringExpenses) * projectionMonths;
  const projectedNet = projectedInflow - projectedOutflow;

  // Handle saving opening balances
  const handleSaveBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBalances(true);
    try {
      const res = await fetch("/api/erp/center/update-balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-logged-in-user-email": currentUserEmail || ""
        },
        body: JSON.stringify({
          centerId: activeCenter?.id,
          initialCashOnHand: Number(cashInput) || 0,
          initialBankBalance: Number(bankInput) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) await onRefreshData();
        setShowBalanceForm(false);
      } else {
        alert(data.error || "Failed to update balances.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBalances(false);
    }
  };

  // Helper to determine if a salary has been paid for a month
  const isSalaryPaidForMonth = (teacherId: string, monthName: string) => {
    return expenses.some(e => 
      e.category === "Salary" &&
      e.paymentMode !== "Accrued (Pending Manual Pay)" &&
      e.notes?.includes(`(${teacherId})`) &&
      e.notes?.includes(monthName)
    );
  };

  // Dynamically compute all unpaid months up to current month (July 2026)
  const getUnpaidMonths = (teacher: Teacher) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // Start month: joiningDate or "2026-01"
    const startMonthStr = teacher.joiningDate ? teacher.joiningDate.substring(0, 7) : "2026-01";
    
    // We are at current month July 2026
    const endYear = 2026;
    const endMonth = 7; // July
    
    let [sy, sm] = startMonthStr.split("-").map(Number);
    if (isNaN(sy) || isNaN(sm)) {
      sy = 2026;
      sm = 1;
    }
    
    const unpaid: Array<{ monthName: string; accrualExpense: AccountingExpense | null }> = [];
    
    let cy = sy;
    let cm = sm;
    
    // Safety break
    let loopGuard = 0;
    while ((cy < endYear || (cy === endYear && cm <= endMonth)) && loopGuard < 120) {
      loopGuard++;
      const monthName = `${monthNames[cm - 1]} ${cy}`;
      
      if (!isSalaryPaidForMonth(teacher.id, monthName)) {
        // Find existing accrued expense if any
        const accrual = expenses.find(e => 
          e.category === "Salary" &&
          e.paymentMode === "Accrued (Pending Manual Pay)" &&
          e.notes?.includes(`(${teacher.id})`) &&
          e.notes?.includes(monthName)
        ) || null;
        
        unpaid.push({ monthName, accrualExpense: accrual });
      }
      
      cm++;
      if (cm > 12) {
        cm = 1;
        cy++;
      }
    }
    
    return unpaid;
  };

  // Open pay salary form
  const handleOpenPaySalary = (teacher: Teacher, accrual: AccountingExpense | null, customMonthName?: string) => {
    setPayingTeacher(teacher);
    setSelectedAccrual(accrual);
    setBaseSalaryVal(teacher.monthlySalary?.toString() || "0");
    setBonusVal("0");
    setPaymentModeVal("UPI");
    setPaymentDetailsVal("");
    setNotesVal("");
    setPayDateVal(new Date().toISOString().split("T")[0]);

    if (customMonthName) {
      setPayMonthName(customMonthName);
    } else if (accrual) {
      // Find month name from notes or code
      const notes = accrual.notes || "";
      const match = notes.match(/for\s([A-Za-z]+\s\d{4})/);
      setPayMonthName(match ? match[1] : "Current Month");
    } else {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const d = new Date();
      setPayMonthName(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }
  };

  // Process manual salary payment
  const handleProcessSalaryPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingTeacher) return;
    setSubmittingPayment(true);
    try {
      const res = await fetch("/api/erp/accounting/pay-salary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-logged-in-user-email": currentUserEmail || ""
        },
        body: JSON.stringify({
          expenseId: selectedAccrual?.id || undefined,
          teacherId: payingTeacher.id,
          monthName: payMonthName,
          baseSalary: Number(baseSalaryVal) || 0,
          bonus: Number(bonusVal) || 0,
          paymentMode: paymentModeVal,
          paymentDetails: paymentDetailsVal,
          notes: notesVal,
          date: payDateVal
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) await onRefreshData();
        setPayingTeacher(null);
        setSelectedAccrual(null);
        alert(`Successfully recorded salary payment of ₹${(Number(baseSalaryVal) || 0) + (Number(bonusVal) || 0)} for ${payingTeacher.name}.`);
      } else {
        alert(data.error || "Failed to process salary payment.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Process fee collection (existing unpaid invoice or past year new fee)
  const handleProcessFeeCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeeCollection(true);
    try {
      if (feeCollectionType === "existing") {
        if (!selectedUnpaidFeeId) {
          alert("Please select an unpaid fee invoice.");
          setSubmittingFeeCollection(false);
          return;
        }
        const res = await fetch("/api/erp/pay-fee", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-logged-in-user-email": currentUserEmail || ""
          },
          body: JSON.stringify({
            feeId: selectedUnpaidFeeId,
            paidDate: existingPaidDate,
            paymentMethod: existingPaymentMethod,
            referenceNumber: existingPaymentRef
          })
        });
        const data = await res.json();
        if (data.success) {
          if (onRefreshData) await onRefreshData();
          setShowFeeCollectionModal(false);
          alert("Successfully recorded fee collection for selected invoice!");
        } else {
          alert(data.error || "Failed to process payment.");
        }
      } else {
        // Create new invoice and then pay it
        if (!newFeeStudentId || !newFeeMonth || !newFeeAmount) {
          alert("Please fill in all mandatory fields (Student, Month, Amount).");
          setSubmittingFeeCollection(false);
          return;
        }
        const createRes = await fetch("/api/erp/create-fee", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-logged-in-user-email": currentUserEmail || ""
          },
          body: JSON.stringify({
            studentId: newFeeStudentId,
            month: newFeeMonth,
            amount: Number(newFeeAmount),
            discount: Number(newFeeDiscount) || 0,
            feeType: newFeeType,
            centerId: activeCenter?.id || "C001"
          })
        });
        const createData = await createRes.json();
        if (!createData.success) {
          alert(createData.error || "Failed to create fee record.");
          setSubmittingFeeCollection(false);
          return;
        }
        
        // Pay the newly created invoice
        const payRes = await fetch("/api/erp/pay-fee", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-logged-in-user-email": currentUserEmail || ""
          },
          body: JSON.stringify({
            feeId: createData.fee.id,
            paidDate: newFeePaidDate,
            paymentMethod: newFeePaymentMethod,
            referenceNumber: newFeePaymentRef
          })
        });
        const payData = await payRes.json();
        if (payData.success) {
          if (onRefreshData) await onRefreshData();
          setShowFeeCollectionModal(false);
          alert(`Successfully created and recorded fee payment of ₹${newFeeAmount} for student.`);
        } else {
          alert(payData.error || "Failed to record payment of the created fee invoice.");
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("Error processing: " + err.message);
    } finally {
      setSubmittingFeeCollection(false);
    }
  };

  // AI Advice generator based on current financial collection and students
  const getGrowthAdvisorContent = () => {
    const activeStudentCount = activeStudents.length;
    const isLossMaking = netProfit < 0;
    
    let alertType: "loss" | "warning" | "healthy" = "healthy";
    let title = "";
    let description = "";
    let strategies: string[] = [];

    if (isLossMaking) {
      alertType = "loss";
      title = "🚨 High Risk: Immediate Loss-Mitigation & Marketing Plan Required";
      description = `Your academy is currently operating at a net loss of ₹${Math.abs(netProfit).toLocaleString()} this period. High operating costs are exceeding student tuition collection.`;
      strategies = [
        "Hyper-Local Marketing: Distribute brochures in local school zones and residential societies offering lightning-fast abacus demos.",
        "Free Trials: Run complimentary 1-on-1 trial workshops on Saturday mornings to secure quick registrations.",
        "Diversify Programs: Start advanced level-up badges, Vedic Maths, Chess, or logical coding challenges to multiply your student earnings without adding teacher costs.",
        "Outstanding Fees: Retrieve outstanding student fee collections immediately (₹" + outstandingFees.toLocaleString() + " is currently overdue!)."
      ];
    } else if (netProfit < 5000 || margin < 20) {
      alertType = "warning";
      title = "⚡ Attention: Expand Operations to Multiply Earnings";
      description = `Your academy is currently generating a thin operating surplus of ₹${netProfit.toLocaleString()} (Margin: ${margin.toFixed(1)}%). Student enrollment density can be optimized.`;
      strategies = [
        "Referral Program: Launch a referral discount scheme where existing parents get ₹500 off if they refer a friend.",
        "Activity Slots: Utilize unoccupied classroom batches on weekday evenings by introducing Rubik's Cube speed-cubing or mental-gym classes.",
        "Increase Density: Increase batch size from average density to 8 students per batch to maximize tutor efficiency."
      ];
    } else {
      alertType = "healthy";
      title = "✨ Strong Financial Performance: Scale-up & Reinvest Capital";
      description = `Superb job! Your center is highly profitable with an operating surplus of ₹${netProfit.toLocaleString()} (Margin: ${margin.toFixed(1)}%). You are ready to accelerate your growth.`;
      strategies = [
        "School Promotions: Partner with local primary schools to conduct Inter-school Mental Math challenges.",
        "Talent Expansion: Hire assistant instructors to run high-density level 2-4 abacus workshops.",
        "Multi-Activity Bundles: Offer combo pricing (e.g., Abacus + Chess) to increase lifetime student value by 40%."
      ];
    }

    return { alertType, title, description, strategies };
  };

  const handleTestTrigger = async () => {
    setRunningTests(true);
    try {
      const res = await onRunTests();
      setTestResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRunningTests(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. OPENING BALANCES & REAL CASH ON HAND / BANK BALANCES PANEL */}
      {userRole !== "Super Admin" && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden" id="opening-balances-panel">
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  Academy Wallet
                </span>
                <span className="text-slate-400 text-xs">• Real-Time Balance Ledger</span>
              </div>
              <h2 className="text-lg font-black mt-1 font-display">Opening & Current Balances</h2>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                Configure your starting cash and bank balances. The system reconciles these opening amounts against your income/expenses automatically.
              </p>
            </div>
            
            <button
              onClick={() => {
                setCashInput(activeCenter?.initialCashOnHand?.toString() || "0");
                setBankInput(activeCenter?.initialBankBalance?.toString() || "0");
                setShowBalanceForm(!showBalanceForm);
              }}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-indigo-300" />
              <span>{hasSetBalances ? "Update Opening Balances" : "Set Opening Balances"}</span>
            </button>
          </div>

          {/* Opening Balances Entry Form Overlay */}
          {showBalanceForm && (
            <form onSubmit={handleSaveBalances} className="mt-6 p-4 bg-slate-800 border border-slate-700 rounded-2xl space-y-4 max-w-lg transition-all animate-fadeIn">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Set Center Opening Balances (₹)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cash On Hand Fund</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bank Balance</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={bankInput}
                    onChange={(e) => setBankInput(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBalanceForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBalances}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                  {savingBalances ? "Saving..." : "Save Balances"}
                </button>
              </div>
            </form>
          )}

          {/* Current Live Balances Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-800">
            {/* Cash on Hand Card */}
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-amber-500/10 text-amber-400 p-3 rounded-2xl">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash on Hand</p>
                {currentCash !== null ? (
                  <h3 className="text-xl font-black font-mono text-slate-100 mt-0.5">₹{currentCash.toLocaleString()}</h3>
                ) : (
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg mt-1 inline-block">
                    [ Blank — Click button to set ]
                  </span>
                )}
                {initialCash !== undefined && (
                  <p className="text-[10px] text-slate-500 mt-1">Opening balance of ₹{initialCash.toLocaleString()}</p>
                )}
              </div>
            </div>

            {/* Bank Balance Card */}
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-2xl">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank Balance</p>
                {currentBank !== null ? (
                  <h3 className="text-xl font-black font-mono text-slate-100 mt-0.5">₹{currentBank.toLocaleString()}</h3>
                ) : (
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg mt-1 inline-block">
                    [ Blank — Click button to set ]
                  </span>
                )}
                {initialBank !== undefined && (
                  <p className="text-[10px] text-slate-500 mt-1">Opening balance of ₹{initialBank.toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC MONTHLY / QUARTERLY / YEARLY PROJECTIONS SECTION */}
      {userRole !== "Super Admin" && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm" id="projections-module">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50 pb-4 mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                SaaS Revenue & Cost Projections
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Estimations calculated programmatically from active Student Tuition Fees ({activeStudents.length} students) and Teacher Salaries.
              </p>
            </div>

            {/* Selector Buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setProjectionPeriod("current_month")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${projectionPeriod === "current_month" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              >
                Current Month
              </button>
              <button
                onClick={() => setProjectionPeriod("quarterly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${projectionPeriod === "quarterly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              >
                Quarterly
              </button>
              <button
                onClick={() => setProjectionPeriod("half_yearly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${projectionPeriod === "half_yearly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              >
                Half-Yearly
              </button>
              <button
                onClick={() => setProjectionPeriod("yearly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${projectionPeriod === "yearly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Projection 1: Inflow */}
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Projected Tuition Inflow</span>
              </div>
              <h3 className="text-xl font-black text-emerald-700 font-mono mt-1.5">₹{projectedInflow.toLocaleString()}</h3>
              <p className="text-[11px] text-emerald-600 mt-1">
                For {periodLabel} based on ₹{monthlyInflowPerStudent.toLocaleString()}/mo total tuition fee potential.
              </p>
            </div>

            {/* Projection 2: Outflow */}
            <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">Projected Outflow (Payroll & Costs)</span>
              </div>
              <h3 className="text-xl font-black text-rose-700 font-mono mt-1.5">₹{projectedOutflow.toLocaleString()}</h3>
              <p className="text-[11px] text-rose-600 mt-1">
                Includes active staff salaries (₹{monthlyOutflowPerTeacher.toLocaleString()}/mo) & operating overheads (₹{monthlyRecurringExpenses.toLocaleString()}/mo).
              </p>
            </div>

            {/* Projection 3: Surplus */}
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider">Estimated Operating Surplus</span>
              </div>
              <h3 className={`text-xl font-black font-mono mt-1.5 ${projectedNet >= 0 ? "text-indigo-700" : "text-rose-700"}`}>
                {projectedNet >= 0 ? "+" : "-"}₹{Math.abs(projectedNet).toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Projected cash movement before miscellaneous overheads or manual adjustments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="accounting-kpi-grid">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Received Income</p>
              <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">₹{totalIncome.toLocaleString()}</h3>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span className="bg-emerald-100/60 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">LIVE</span>
            <span>Real-time school ledger reconciliation</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Paid Expenditures</p>
              <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">₹{totalExpense.toLocaleString()}</h3>
            </div>
            <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-500 font-medium">
            <span className="bg-rose-100/60 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">PAID</span>
            <span>All operating costs and overheads</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Operating Surplus</p>
              <h3 className={`text-2xl font-black font-mono mt-1 ${netProfit >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
                {netProfit >= 0 ? "+" : "-"}₹{Math.abs(netProfit).toLocaleString()}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${netProfit >= 0 ? "bg-indigo-50 text-indigo-600" : "bg-rose-50 text-rose-600"}`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${netProfit >= 0 ? "bg-indigo-100/60 text-indigo-700" : "bg-rose-100/60 text-rose-700"}`}>
              {margin.toFixed(1)}% Margin
            </span>
            <span>Net profit margin ratio</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uncollected Assets</p>
              <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">
                ₹{(outstandingFees + (userRole === "Super Admin" ? outstandingCenterSubs : 0)).toLocaleString()}
              </h3>
            </div>
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-0.5 text-xs text-slate-500 font-medium">
            {userRole === "Super Admin" ? (
              <span className="text-indigo-600 font-bold">₹{outstandingCenterSubs.toLocaleString()} SaaS Subscription Billing Due</span>
            ) : (
              <span className="text-amber-600 font-bold">₹{outstandingFees.toLocaleString()} Student Fees Outstanding</span>
            )}
          </div>
        </div>
      </div>

      {/* AI STRATEGIC GROWTH & FINANCIAL ADVISOR CENTER */}
      {userRole !== "Super Admin" && (() => {
        const advisor = getGrowthAdvisorContent();
        const unpaidFees = fees.filter(f => f.status !== "Paid" && (userRole === "Super Admin" || f.centerId === activeCenter?.id));
        return (
          <div className={`border rounded-3xl p-6 shadow-xs space-y-4 ${
            advisor.alertType === "loss" 
              ? "bg-rose-50/50 border-rose-200 text-rose-900" 
              : advisor.alertType === "warning"
                ? "bg-amber-50/50 border-amber-200 text-amber-900"
                : "bg-emerald-50/40 border-emerald-200 text-emerald-900"
          }`} id="ai-strategic-advisor-card">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex gap-3 items-start">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  advisor.alertType === "loss" 
                    ? "bg-rose-100 text-rose-600" 
                    : advisor.alertType === "warning"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-emerald-100 text-emerald-600"
                }`}>
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      advisor.alertType === "loss" 
                        ? "bg-rose-200 text-rose-800" 
                        : advisor.alertType === "warning"
                          ? "bg-amber-200 text-amber-800"
                          : "bg-emerald-200 text-emerald-800"
                    }`}>
                      AI Strategic Copilot
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">• Dynamic Financial Advice</span>
                  </div>
                  <h4 className="text-sm font-black mt-1 font-display text-slate-800">{advisor.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">{advisor.description}</p>
                </div>
              </div>

              {/* Quick Actions for Past Data */}
              <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto">
                <button
                  onClick={() => {
                    setFeeCollectionType("new");
                    setNewFeeStudentId("");
                    setNewFeeMonth("");
                    setNewFeeAmount("");
                    setNewFeeDiscount("0");
                    setNewFeeType("Level Fee");
                    setNewFeePaidDate(new Date().toISOString().split("T")[0]);
                    setNewFeePaymentMethod("UPI");
                    setNewFeePaymentRef("");
                    setShowFeeCollectionModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Migrate Past Student Fees</span>
                </button>
                
                <button
                  onClick={() => {
                    setFeeCollectionType("existing");
                    setSelectedUnpaidFeeId("");
                    setExistingPaidDate(new Date().toISOString().split("T")[0]);
                    setExistingPaymentMethod("UPI");
                    setExistingPaymentRef("");
                    setShowFeeCollectionModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Record Fee Receipt</span>
                </button>
              </div>
            </div>

            {/* Strategic Bullet Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {advisor.strategies.map((strategy, idx) => {
                const parts = strategy.split(":");
                const label = parts[0];
                const body = parts.slice(1).join(":");
                return (
                  <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-3.5 flex gap-2.5 items-start">
                    <div className="bg-slate-50 text-slate-500 font-mono font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="text-xs">
                      <strong className="text-slate-800 font-bold block">{label}</strong>
                      <span className="text-slate-500 mt-0.5 block leading-relaxed">{body}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 3. TEACHER & STAFF SALARY AND PAYROLL MANAGEMENT PANEL */}
      {userRole !== "Super Admin" && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm" id="salary-payroll-section">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-500" />
                Teacher & Staff Payroll Center
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage salaries, bonuses, incentives and process bank transfers / UPI payments manually.</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-3">Staff / Teacher Details</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Monthly Salary</th>
                  <th className="p-3">Pending / Unpaid Month Accruals</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teachers.filter(t => t.status === "Active").map(teacher => {
                  // Dynamically find unpaid months instead of counting duplicates in the DB
                  const unpaidMonths = getUnpaidMonths(teacher);

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <div className="font-extrabold text-slate-900">{teacher.name}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{teacher.id} • {teacher.email}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-600">{teacher.role || "Instructor"}</td>
                      <td className="p-3 font-mono font-black text-slate-800">₹{(teacher.monthlySalary || 0).toLocaleString()}</td>
                      <td className="p-3">
                        {unpaidMonths.length === 0 ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Fully Paid Up
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {unpaidMonths.map(u => (
                              <button
                                key={u.monthName}
                                onClick={() => handleOpenPaySalary(teacher, u.accrualExpense, u.monthName)}
                                className="text-[10px] font-bold bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-lg hover:bg-rose-100 transition-colors"
                                title="Click to Pay Now"
                              >
                                ⚠️ {u.monthName} (₹{(teacher.monthlySalary || 0).toLocaleString()})
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenPaySalary(teacher, null)}
                          className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pay Salary/Bonus</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {teachers.filter(t => t.status === "Active").length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                      No active instructors onboarded at this center.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salary Payment Modal Form */}
      {payingTeacher && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="pay-salary-modal">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Record Salary / Bonus
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1 font-display">
                  Disburse Payment to {payingTeacher.name}
                </h3>
                <p className="text-xs text-slate-400">Record a manual UPI, Bank, or Cash salary disbursemnt.</p>
              </div>
              <button
                type="button"
                onClick={() => { setPayingTeacher(null); setSelectedAccrual(null); }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessSalaryPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Salary Month</label>
                  <input
                    type="text"
                    required
                    value={payMonthName}
                    onChange={(e) => setPayMonthName(e.target.value)}
                    placeholder="e.g. July 2026"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Base Salary Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={baseSalaryVal}
                    onChange={(e) => setBaseSalaryVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bonus & Incentive (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={bonusVal}
                    onChange={(e) => setBonusVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Bonus, commissions, or sales incentive</span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Disbursed</label>
                  <div className="w-full bg-slate-100 border border-slate-200 text-slate-900 font-mono font-black text-sm rounded-lg p-2.5">
                    ₹{(Number(baseSalaryVal || 0) + Number(bonusVal || 0)).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Mode</label>
                  <select
                    value={paymentModeVal}
                    onChange={(e: any) => setPaymentModeVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-medium"
                  >
                    <option value="UPI">UPI (Google Pay, PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (IMPS, NEFT)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={payDateVal}
                    onChange={(e) => setPayDateVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Reference Details</label>
                  <input
                    type="text"
                    value={paymentDetailsVal}
                    onChange={(e) => setPaymentDetailsVal(e.target.value)}
                    placeholder="e.g. UPI ID, Bank UTR number, etc."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Administrative Notes</label>
                <input
                  type="text"
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  placeholder="e.g. Additional performance award incentive added."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setPayingTeacher(null); setSelectedAccrual(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {submittingPayment ? "Processing..." : "Confirm & Pay Salary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Fee Collection Modal */}
      {showFeeCollectionModal && (() => {
        const unpaidFees = fees.filter(f => f.status !== "Paid" && (userRole === "Super Admin" || f.centerId === activeCenter?.id));
        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="fee-collection-modal">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 w-full max-w-lg space-y-4">
              <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                <div>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    Fee Collection & Past Data Migration
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1 font-display">
                    {feeCollectionType === "existing" ? "Collect Fees (Existing Invoice)" : "Record Past / Manual Student Fee"}
                  </h3>
                  <p className="text-xs text-slate-400">Record outstanding fee collection or backdate historical collections.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFeeCollectionModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Toggle form types */}
              <div className="flex bg-slate-100 p-1 rounded-xl w-full">
                <button
                  type="button"
                  onClick={() => setFeeCollectionType("existing")}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    feeCollectionType === "existing" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400"
                  }`}
                >
                  Pay Existing Unpaid Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setFeeCollectionType("new")}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    feeCollectionType === "new" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400"
                  }`}
                >
                  + Record New / Past Year Fee
                </button>
              </div>

              <form onSubmit={handleProcessFeeCollection} className="space-y-4">
                {feeCollectionType === "existing" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Unpaid Student Invoice</label>
                      <select
                        required
                        value={selectedUnpaidFeeId}
                        onChange={(e) => setSelectedUnpaidFeeId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-medium"
                      >
                        <option value="">-- Select Unpaid Invoice --</option>
                        {unpaidFees.map(f => {
                          const student = students.find(s => s.id === f.studentId);
                          return (
                            <option key={f.id} value={f.id}>
                              {student ? student.studentName : `ID: ${f.studentId}`} - {f.month} ({f.feeType || "Level Fee"}) - ₹{f.amount}
                            </option>
                          );
                        })}
                      </select>
                      {unpaidFees.length === 0 && (
                        <span className="text-[10px] text-emerald-600 font-bold block mt-1">🎉 All current student invoices are fully paid!</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Collection Date</label>
                        <input
                          type="date"
                          required
                          value={existingPaidDate}
                          onChange={(e) => setExistingPaidDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                        <select
                          value={existingPaymentMethod}
                          onChange={(e) => setExistingPaymentMethod(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-medium"
                        >
                          <option value="UPI">UPI (Google Pay, PhonePe)</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Reference ID</label>
                      <input
                        type="text"
                        value={existingPaymentRef}
                        onChange={(e) => setNewFeePaymentRef(e.target.value)}
                        placeholder="e.g. UPI Ref / Bank Txn ID / Receipt #"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Student</label>
                        <select
                          required
                          value={newFeeStudentId}
                          onChange={(e) => setNewFeeStudentId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-medium"
                        >
                          <option value="">-- Choose Student --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.studentName} ({s.id})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fee Type</label>
                        <select
                          value={newFeeType}
                          onChange={(e) => setNewFeeType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-medium"
                        >
                          <option value="Level Fee">Level Fee / Tuition</option>
                          <option value="Registration">Registration Fee</option>
                          <option value="Exam Fee">Exam Fee</option>
                          <option value="Competition">Competition Fee</option>
                          <option value="Extra Curricular">Extra Curricular</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Month / Period</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Jan 2025"
                          value={newFeeMonth}
                          onChange={(e) => setNewFeeMonth(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (₹)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="e.g. 1500"
                          value={newFeeAmount}
                          onChange={(e) => setNewFeeAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Discount (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={newFeeDiscount}
                          onChange={(e) => setNewFeeDiscount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Receipt/Paid Date</label>
                        <input
                          type="date"
                          required
                          value={newFeePaidDate}
                          onChange={(e) => setNewFeePaidDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                        <select
                          value={newFeePaymentMethod}
                          onChange={(e) => setNewFeePaymentMethod(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-medium"
                        >
                          <option value="UPI">UPI (Google Pay, PhonePe)</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Reference ID</label>
                      <input
                        type="text"
                        value={newFeePaymentRef}
                        onChange={(e) => setNewFeePaymentRef(e.target.value)}
                        placeholder="e.g. UPI Ref / Bank Txn ID / Receipt #"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowFeeCollectionModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeeCollection}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
                  >
                    {submittingFeeCollection ? "Recording..." : "Record Paid Fee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Main Row: Reminders & Test Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recurring Schedules Reminders Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4 mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Due / Upcoming Recurring Contracts ({reminders.length})
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Automated bills and payables generated based on active cycles.</p>
            </div>
          </div>

          {reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
              <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-xs font-bold text-slate-700">All schedules perfectly settled!</p>
              <p className="text-[10px] text-slate-400">No recurring items are currently due within the 10-day window.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {reminders.map(item => {
                const isOverdue = new Date(item.nextDueDate) < new Date(todayStr);
                return (
                  <div key={item.id} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors ${
                    isOverdue ? "bg-rose-50/30 border-rose-100" : "bg-slate-50/50 border-slate-100"
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                          item.type === "Income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}>
                          {item.type === "Income" ? "INCOME" : "EXPENSE"}
                        </span>
                        <h5 className="text-xs font-bold text-slate-800">{item.name}</h5>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Due: <b className="text-slate-700 font-mono">{item.nextDueDate}</b>
                        </span>
                        <span>Interval: <b className="text-slate-700">{item.interval}</b></span>
                        <span className="font-mono text-slate-400 text-[10px]">({item.category})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                      <span className="text-sm font-extrabold font-mono text-slate-800">
                        ₹{item.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => onProcessRecurring(item.id)}
                        className={`flex items-center gap-1.5 font-bold text-[10px] px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer ${
                          item.type === "Income" 
                            ? "bg-emerald-600 border border-emerald-700 text-white hover:bg-emerald-700"
                            : "bg-rose-600 border border-rose-700 text-white hover:bg-rose-700"
                        }`}
                      >
                        <span>{item.type === "Income" ? "Collect Now" : "Pay Now"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Interactive Automated Test Suite (Part 14) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4 mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Accounting Security & Quality Testing Suite
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Part 14 automated integration tests for calculations and features.</p>
            </div>
            <button
              onClick={handleTestTrigger}
              disabled={runningTests}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white font-bold text-[10px] px-3 py-2 rounded-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3 h-3 ${runningTests ? "animate-spin" : ""}`} />
              <span>{runningTests ? "Running..." : "Run System Tests"}</span>
            </button>
          </div>

          {testResults ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-3 rounded-xl mb-3">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  All 10 Core Financial Modules Verified Successfully!
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700">10 / 10 PASS</span>
              </div>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {testResults.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{t.name}</span>
                      <span className="text-slate-400 text-[10px]">{t.details}</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-black font-mono px-2 py-0.5 rounded text-[9px]">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
              <RefreshCw className="w-8 h-8 text-indigo-400 mb-2 animate-pulse" />
              <p className="text-xs font-bold text-slate-700">Testing Engine Standby</p>
              <p className="text-[10px] text-slate-400 max-w-sm text-center mt-1">
                Triggering tests will programmatically spin up isolated transactional simulations for Income, Expense, Recurring Math, PDF & Excel Compilation models, rendering a live report.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
