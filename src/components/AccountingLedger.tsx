import React, { useState } from "react";
import { 
  Plus, Search, Trash2, Edit3, Paperclip, Eye, X, Calendar, 
  User, CreditCard, FileText, Check, DollarSign, ArrowDownLeft, ArrowUpRight
} from "lucide-react";
import { AccountingIncome, AccountingExpense } from "../types";

interface Props {
  incomes: AccountingIncome[];
  expenses: AccountingExpense[];
  onAddIncome: (data: Partial<AccountingIncome>) => Promise<void>;
  onEditIncome: (id: string, data: Partial<AccountingIncome>) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
  onAddExpense: (data: Partial<AccountingExpense>) => Promise<void>;
  onEditExpense: (id: string, data: Partial<AccountingExpense>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  userRole: string;
}

export const AccountingLedger: React.FC<Props> = ({
  incomes,
  expenses,
  onAddIncome,
  onEditIncome,
  onDeleteIncome,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  userRole
}) => {
  const [activeLedgerTab, setActiveLedgerTab] = useState<"Income" | "Expense">("Income");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("");
  
  // Modals / Form states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; type: "Income" | "Expense" } | null>(null);
  const [attachmentBase64, setAttachmentBase64] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  
  // Form values
  const [dateVal, setDateVal] = useState(new Date().toISOString().split("T")[0]);
  const [nameVal, setNameVal] = useState(""); // Student name for Income, Vendor name for Expense
  const [categoryVal, setCategoryVal] = useState("");
  const [amountVal, setAmountVal] = useState("");
  const [paymentModeVal, setPaymentModeVal] = useState<"Cash" | "UPI" | "Bank Transfer" | "Card" | "Cheque">("UPI");
  const [docNumVal, setDocNumVal] = useState(""); // Receipt Number for Income, Invoice Number for Expense
  const [notesVal, setNotesVal] = useState("");
  const [frequencyVal, setFrequencyVal] = useState<"Monthly" | "Quarterly" | "Half-Yearly" | "Yearly" | "One-time payment">("One-time payment");
  
  // View Attachment Modal State
  const [viewAttachmentUrl, setViewAttachmentUrl] = useState<string | null>(null);

  const isSuperAdmin = userRole === "Super Admin";

  const INCOME_CATEGORIES = isSuperAdmin
    ? [
        "Center Subscription Income",
        "Franchise Income",
        "Workshop Income",
        "Other Company Income"
      ]
    : [
        "Registration Fee",
        "Course Fee",
        "Exam Fee",
        "Material Fee",
        "Workshop Fee",
        "Other Income"
      ];

  const EXPENSE_CATEGORIES = isSuperAdmin
    ? [
        "Domain Cost",
        "Hosting Cost",
        "Server Cost",
        "Firestore Cost",
        "WhatsApp API Cost",
        "Email Service Cost",
        "Marketing Cost",
        "Meta Ads Cost",
        "Google Ads Cost",
        "Staff Salary",
        "Office Expenses",
        "Software Subscriptions",
        "Other Business Expenses"
      ]
    : [
        "Teacher Salary",
        "Rent",
        "Electricity",
        "Internet",
        "Marketing",
        "Books",
        "Courier",
        "Other Expenses"
      ];

  const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Card", "Cheque"];

  const openAddModal = (type: "Income" | "Expense") => {
    setActiveLedgerTab(type);
    setEditingItem(null);
    setDateVal(new Date().toISOString().split("T")[0]);
    setNameVal("");
    setCategoryVal(type === "Income" 
      ? (isSuperAdmin ? "Center Subscription Income" : "Course Fee") 
      : (isSuperAdmin ? "Domain Cost" : "Rent")
    );
    setAmountVal("");
    setPaymentModeVal("UPI");
    setDocNumVal(type === "Income" ? `REC-${Date.now().toString().slice(-6)}` : `INV-${Date.now().toString().slice(-6)}`);
    setNotesVal("");
    setAttachmentBase64("");
    setAttachmentName("");
    setFrequencyVal("One-time payment");
    setShowFormModal(true);
  };

  const openEditModal = (item: any, type: "Income" | "Expense") => {
    setEditingItem({ id: item.id, type });
    setDateVal(item.date);
    setNameVal(type === "Income" ? item.studentName : item.vendorName);
    setCategoryVal(item.category);
    setAmountVal(item.amount.toString());
    setPaymentModeVal(item.paymentMode);
    setDocNumVal(type === "Income" ? item.receiptNumber : item.invoiceNumber);
    setNotesVal(item.notes);
    setAttachmentBase64(item.attachmentUrl || "");
    setAttachmentName(item.attachmentUrl ? "Invoice Attachment" : "");
    setFrequencyVal(item.frequency || "One-time payment");
    setShowFormModal(true);
  };

  // Convert uploaded image/doc to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setAttachmentBase64(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameVal || !amountVal || !categoryVal) return;

    const amount = Number(amountVal);
    if (isNaN(amount) || amount <= 0) return;

    if (activeLedgerTab === "Income") {
      const payload: Partial<AccountingIncome> = {
        date: dateVal,
        studentName: nameVal,
        category: categoryVal as any,
        amount,
        paymentMode: paymentModeVal,
        receiptNumber: docNumVal,
        notes: notesVal
      };
      if (editingItem) {
        await onEditIncome(editingItem.id, payload);
      } else {
        await onAddIncome(payload);
      }
    } else {
      const payload: Partial<AccountingExpense> = {
        date: dateVal,
        category: categoryVal as any,
        vendorName: nameVal,
        amount,
        paymentMode: paymentModeVal,
        invoiceNumber: docNumVal,
        notes: notesVal,
        attachmentUrl: attachmentBase64,
        frequency: frequencyVal
      };
      if (editingItem) {
        await onEditExpense(editingItem.id, payload);
      } else {
        await onAddExpense(payload);
      }
    }

    setShowFormModal(false);
    setEditingItem(null);
  };

  const filteredIncomes = incomes.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = item.studentName.toLowerCase().includes(query) || 
                          item.receiptNumber.toLowerCase().includes(query) || 
                          item.notes.toLowerCase().includes(query);
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
    const matchesPayment = paymentModeFilter ? item.paymentMode === paymentModeFilter : true;
    return matchesSearch && matchesCategory && matchesPayment;
  });

  const filteredExpenses = expenses.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = item.vendorName.toLowerCase().includes(query) || 
                          item.invoiceNumber.toLowerCase().includes(query) || 
                          item.notes.toLowerCase().includes(query);
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
    const matchesPayment = paymentModeFilter ? item.paymentMode === paymentModeFilter : true;
    return matchesSearch && matchesCategory && matchesPayment;
  });

  const isSalesStaff = userRole === "Sales Staff";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-6">
      
      {/* Title & Add Buttons Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 font-display">Ledger Entries & Receipts Ledger</h4>
          <p className="text-xs text-slate-400">Detailed accounts books tracking each cash flow movement.</p>
        </div>
        {!isSalesStaff && (
          <div className="flex gap-2.5 w-full md:w-auto">
            <button
              onClick={() => openAddModal("Income")}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Income</span>
            </button>
            <button
              onClick={() => openAddModal("Expense")}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        )}
      </div>

      {/* Ledger Tab Selection & Live Filters Bar */}
      <div className="flex flex-col xl:flex-row justify-between gap-4 border-b border-slate-100 pb-3">
        {/* Sub-tabs selector */}
        <div className="flex bg-slate-50 p-1 rounded-xl w-fit">
          <button
            onClick={() => { setActiveLedgerTab("Income"); setCategoryFilter(""); }}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeLedgerTab === "Income" 
                ? "bg-white text-emerald-700 shadow-sm border border-slate-100" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
            Income Ledger ({filteredIncomes.length})
          </button>
          <button
            onClick={() => { setActiveLedgerTab("Expense"); setCategoryFilter(""); }}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeLedgerTab === "Expense" 
                ? "bg-white text-rose-700 shadow-sm border border-slate-100" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
            Expense Ledger ({filteredExpenses.length})
          </button>
        </div>

        {/* Real-time filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full xl:w-auto">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 w-full"
            />
          </div>

          {/* Category drop down */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white"
          >
            <option value="">All Categories</option>
            {(activeLedgerTab === "Income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Payment Mode */}
          <select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white"
          >
            <option value="">All Payment Modes</option>
            {PAYMENT_MODES.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Layout */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase font-mono">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">{activeLedgerTab === "Income" ? "Student / Customer" : "Recipient / Vendor"}</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Payment Mode</th>
              <th className="py-3 px-4">{activeLedgerTab === "Income" ? "Receipt No." : "Invoice No."}</th>
              <th className="py-3 px-4">Notes</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
            {activeLedgerTab === "Income" ? (
              filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">No income receipts found.</td>
                </tr>
              ) : (
                filteredIncomes.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-500 whitespace-nowrap">{item.date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{item.studentName}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-500">{item.paymentMode}</td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">{item.receiptNumber}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500" title={item.notes}>{item.notes || "-"}</td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-emerald-600">+₹{item.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {!isSalesStaff && (
                          <>
                            <button
                              onClick={() => openEditModal(item, "Income")}
                              className="text-slate-400 hover:text-indigo-600 p-1"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteIncome(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )
            ) : (
              filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">No expense vouchers found.</td>
                </tr>
              ) : (
                filteredExpenses.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-500 whitespace-nowrap">{item.date}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{item.vendorName}</span>
                        {item.frequency && item.frequency !== "One-time payment" && (
                          <span className="text-[9px] text-indigo-600 font-extrabold tracking-wider uppercase font-mono mt-0.5">
                            🔄 {item.frequency}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-500">{item.paymentMode}</td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400 flex items-center gap-1.5">
                      {item.invoiceNumber}
                      {item.attachmentUrl && (
                        <button
                          onClick={() => setViewAttachmentUrl(item.attachmentUrl || null)}
                          className="text-indigo-500 hover:text-indigo-700"
                          title="View Receipt Attachment"
                        >
                          <Paperclip className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500" title={item.notes}>{item.notes || "-"}</td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-rose-600">-₹{item.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {!isSalesStaff && (
                          <>
                            <button
                              onClick={() => openEditModal(item, "Expense")}
                              className="text-slate-400 hover:text-indigo-600 p-1"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteExpense(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Record / Edit Dialog Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold font-display">
                  {editingItem ? "Modify Ledger Record" : `Log New ${activeLedgerTab}`}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Please populate the ledger entry coordinates.</p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={dateVal}
                      onChange={(e) => setDateVal(e.target.value)}
                      className="pl-8 pr-2 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                    />
                  </div>
                </div>

                {/* Categories selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Category</label>
                  <select
                    required
                    value={categoryVal}
                    onChange={(e) => setCategoryVal(e.target.value)}
                    className="p-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                  >
                    {(activeLedgerTab === "Income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipient / Student Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  {activeLedgerTab === "Income" ? "Student Name / Customer" : "Recipient / Vendor Name"}
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={activeLedgerTab === "Income" ? "e.g. Aditya Sharma" : "e.g. DLF Properties / Teacher Name"}
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    className="pl-8 pr-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Amount */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 1500"
                      value={amountVal}
                      onChange={(e) => setAmountVal(e.target.value)}
                      className="pl-6 pr-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold"
                    />
                  </div>
                </div>

                {/* Receipt/Invoice Doc Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    {activeLedgerTab === "Income" ? "Receipt Number" : "Invoice Number"}
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. REC-10294"
                      value={docNumVal}
                      onChange={(e) => setDocNumVal(e.target.value)}
                      className="pl-8 pr-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Payment Mode</label>
                <div className="relative">
                  <CreditCard className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={paymentModeVal}
                    onChange={(e) => setPaymentModeVal(e.target.value as any)}
                    className="pl-8 pr-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                  >
                    {PAYMENT_MODES.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expense Frequency Cycle Selection */}
              {activeLedgerTab === "Expense" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Expense Cycle / Frequency</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={frequencyVal}
                      onChange={(e) => setFrequencyVal(e.target.value as any)}
                      className="pl-8 pr-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold text-indigo-700"
                    >
                      <option value="One-time payment">One-time payment</option>
                      <option value="Monthly">Monthly Recurring</option>
                      <option value="Quarterly">Quarterly Recurring</option>
                      <option value="Half-Yearly">Half-Yearly Recurring</option>
                      <option value="Yearly">Yearly Recurring</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Notes & Description</label>
                <textarea
                  placeholder="Memo references, payment comments..."
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  rows={2}
                  className="p-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                />
              </div>

              {/* Attachment Receipt Upload (Strictly for Expenses) */}
              {activeLedgerTab === "Expense" && (
                <div className="border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Upload Receipt Attachment</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {attachmentName && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Loaded
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-black text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer"
              >
                {editingItem ? "Apply Changes" : `Create ${activeLedgerTab} Record`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Base64 Receipt Viewer Modal */}
      {viewAttachmentUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-4 shadow-2xl max-w-lg w-full flex flex-col items-center">
            <div className="flex justify-between w-full items-center mb-3">
              <span className="text-xs font-bold text-slate-700">Receipt Attachment Invoice</span>
              <button onClick={() => setViewAttachmentUrl(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            {viewAttachmentUrl.startsWith("data:image/") ? (
              <img src={viewAttachmentUrl} className="max-h-[400px] object-contain rounded-lg border" alt="Voucher Receipt" />
            ) : (
              <div className="flex flex-col items-center justify-center p-10 border rounded-lg bg-slate-50 w-full text-center">
                <FileText className="w-10 h-10 text-indigo-500 mb-2" />
                <span className="text-xs text-slate-600">Base64 Document File</span>
                <a
                  href={viewAttachmentUrl}
                  download="receipt_document"
                  className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
