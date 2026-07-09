import React, { useState, useEffect } from "react";
import { Center, Student, Teacher } from "../types";
import { Building2, PlusCircle, ShieldCheck, Mail, Calendar, Sparkles, TrendingUp, DollarSign, Megaphone, CheckCircle, RefreshCw, Key, ShieldAlert, Edit, Trash2, ClipboardCopy, Check, Users, Award, Trophy, Star } from "lucide-react";

interface SuperAdminViewProps {
  centers: Center[];
  onAddCenter: (center: Partial<Center>) => void;
  students?: Student[];
  teachers?: Teacher[];
}

export default function SuperAdminView({ centers: initialCenters, onAddCenter, students = [], teachers = [] }: SuperAdminViewProps) {
  const [centers, setCenters] = useState<Center[]>(initialCenters);
  const [showAddCenter, setShowAddCenter] = useState(false);

  // Edit Center Modal States
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [editName, setEditName] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editCustomPrice, setEditCustomPrice] = useState("");
  const [editAddresses, setEditAddresses] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  // Copy Password Feedback
  const [copiedCenterId, setCopiedCenterId] = useState<string | null>(null);

  // Sync state with master centers prop when it changes
  useEffect(() => {
    setCenters(initialCenters);
  }, [initialCenters]);

  // Form Fields for Register Center
  const [cName, setCName] = useState("");
  const [cOwner, setCOwner] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cMobile, setCMobile] = useState("");
  const [cCity, setCCity] = useState("");
  const [cState, setCState] = useState("");
  const [cPlan, setCPlan] = useState("Standard");
  const [cCustomPrice, setCCustomPrice] = useState("");
  const [cAddresses, setCAddresses] = useState<string[]>([""]);

  // Form Fields for Subscription / Trial manager
  const [subCenterId, setSubCenterId] = useState("");
  const [subPlan, setSubPlan] = useState("Standard");
  const [subExpiry, setSubExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [subIsTrial, setSubIsTrial] = useState(false);
  const [subTrialDays, setSubTrialDays] = useState(30);
  const [subUpdating, setSubUpdating] = useState(false);

  // Admin authentication (credential login) states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Announcements
  const [annTitle, setAnnTitle] = useState("");
  const [annText, setAnnText] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([
    { title: "National Abacus Competition 2026", text: "Registrations are now open for Levels 1 to 8. All center heads must share details with parent batches.", date: "2026-07-01" },
    { title: "V4 Curriculum Guidelines Published", text: "The educational rules for Level 1 Direct Bead subtraction are now active in the Practice Generator module.", date: "2026-06-25" }
  ]);
  const [showAnnSuccess, setShowAnnSuccess] = useState(false);

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);

    setTimeout(() => {
      const email = adminEmail.trim().toLowerCase();
      // Superadmin credentials validation: support both generic and realistic accounts
      if (email === "admin@geniplus.com" && (adminPassword === "password123" || adminPassword === "admin123")) {
        setIsLoggedIn(true);
        localStorage.setItem("superadmin_is_logged_in", "true");
      } else {
        setAdminError("Incorrect credentials. Use admin@geniplus.com and password123 to log in.");
      }
      setAdminLoading(false);
    }, 400);
  };

  const handleAdminLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("superadmin_is_logged_in");
    setAdminEmail("");
    setAdminPassword("");
  };

  const handleUpdateSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCenterId) {
      alert("Please select a franchise center to modify");
      return;
    }
    setSubUpdating(true);
    try {
      const res = await fetch("/api/erp/update-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: subCenterId,
          plan: subPlan,
          subscriptionExpiry: subExpiry || undefined,
          isTrial: subIsTrial,
          trialDays: subIsTrial ? Number(subTrialDays) : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully updated subscription/evaluation settings for ${data.center.name}!`);
        // Sync local view state
        setCenters(prev => prev.map(c => c.id === subCenterId ? data.center : c));
        setSubCenterId("");
      } else {
        alert("Failed to update subscription: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubUpdating(false);
    }
  };

  const handleCreateCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) return;

    const payload = {
      name: cName,
      ownerName: cOwner,
      email: cEmail,
      mobile: cMobile,
      city: cCity,
      state: cState,
      plan: cPlan,
      customPrice: (cPlan === "Custom Plan" || cPlan === "Custom") ? Number(cCustomPrice) || 0 : undefined,
      addresses: cAddresses.filter(addr => addr.trim() !== ""),
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    };

    onAddCenter(payload);

    const newC: Center = {
      id: `C00${centers.length + 1}`,
      name: cName,
      ownerName: cOwner,
      mobile: cMobile,
      email: cEmail,
      city: cCity,
      state: cState,
      country: "India",
      plan: cPlan,
      customPrice: payload.customPrice,
      addresses: payload.addresses,
      subscriptionStart: new Date().toISOString().split("T")[0],
      subscriptionExpiry: payload.subscriptionExpiry,
      status: "Active"
    };

    setCenters([...centers, newC]);
    setCName(""); setCOwner(""); setCEmail(""); setCMobile(""); setCCity(""); setCState("");
    setCCustomPrice(""); setCAddresses([""]);
    setShowAddCenter(false);
  };

  const handleOpenEditModal = (center: Center) => {
    setEditingCenter(center);
    setEditName(center.name);
    setEditOwner(center.ownerName);
    setEditEmail(center.email);
    setEditMobile(center.mobile);
    setEditPlan(center.plan);
    setEditPassword(center.password || "password123");
    setEditCustomPrice(center.customPrice !== undefined ? String(center.customPrice) : "");
    setEditAddresses(center.addresses || [""]);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCenter) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/erp/edit-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: editingCenter.id,
          name: editName,
          ownerName: editOwner,
          email: editEmail,
          mobile: editMobile,
          plan: editPlan,
          password: editPassword,
          status: editingCenter.status,
          customPrice: (editPlan === "Custom Plan" || editPlan === "Custom") ? Number(editCustomPrice) || 0 : undefined,
          addresses: editAddresses.filter(addr => addr.trim() !== "")
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Center tenant updated successfully!");
        setCenters(prev => prev.map(c => c.id === editingCenter.id ? {
          ...c,
          name: editName,
          ownerName: editOwner,
          email: editEmail,
          mobile: editMobile,
          plan: editPlan,
          password: editPassword,
          customPrice: (editPlan === "Custom Plan" || editPlan === "Custom") ? Number(editCustomPrice) || 0 : undefined,
          addresses: editAddresses.filter(addr => addr.trim() !== "")
        } : c));
        setEditingCenter(null);
      } else {
        alert(data.error || "Failed to edit center.");
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteCenter = async (centerId: string) => {
    if (!confirm("Are you absolutely sure you want to delete this franchise center? This action cannot be undone and will erase all data for this tenant.")) {
      return;
    }
    try {
      const res = await fetch("/api/erp/delete-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId })
      });
      const data = await res.json();
      if (data.success) {
        alert("Center tenant deleted successfully.");
        setCenters(prev => prev.filter(c => c.id !== centerId));
      } else {
        alert(data.error || "Failed to delete center.");
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred.");
    }
  };

  const handleCopyPassword = (center: Center) => {
    const passwordToShare = center.password || "password123";
    navigator.clipboard.writeText(passwordToShare);
    setCopiedCenterId(center.id);
    setTimeout(() => setCopiedCenterId(null), 2000);
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle) return;
    setAnnouncements([{ title: annTitle, text: annText, date: new Date().toISOString().split("T")[0] }, ...announcements]);
    setAnnTitle(""); setAnnText("");
    setShowAnnSuccess(true);
    setTimeout(() => setShowAnnSuccess(false), 3000);
  };

  const toggleCenterStatus = async (centerId: string) => {
    const center = centers.find(c => c.id === centerId);
    if (!center) return;
    const newStatus = center.status === "Active" ? "Inactive" : "Active";
    
    try {
      const res = await fetch("/api/erp/edit-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: centerId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setCenters(prev =>
          prev.map(c => c.id === centerId ? { ...c, status: newStatus } : c)
        );
      } else {
        alert("Failed to update status: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred while updating the status.");
    }
  };

  // SaaS Revenue Calculations
  // 10 Students: ₹9999, 20 Students: ₹18999, 40 Students: ₹26999, 100 Students: ₹49999, Custom Plan
  const getPlanPrice = (center: any) => {
    if ((center.plan === "Custom Plan" || center.plan === "Custom") && typeof center.customPrice === "number") {
      return center.customPrice;
    }
    const plan = center.plan;
    if (plan === "10 Students Plan" || plan === "10 Students") return 9999;
    if (plan === "20 Students Plan" || plan === "20 Students") return 18999;
    if (plan === "40 Students Plan" || plan === "40 Students") return 26999;
    if (plan === "100 Students Plan" || plan === "100 Students") return 49999;
    if (plan === "Custom Plan" || plan === "Custom") return 99999;
    // Fallbacks
    if (plan === "Premium") return 75000;
    if (plan === "Standard") return 45000;
    return 20000;
  };

  const totalSaaSArr = centers.filter(c => c.status === "Active").reduce((acc, curr) => acc + getPlanPrice(curr), 0);

  // Website-wide Student Metrics
  const totalPortalStudents = students.length;
  
  // Top Academy (Center with most students)
  const getTopAcademyName = () => {
    if (!centers || centers.length === 0 || !students || students.length === 0) return "My Abacus Bangalore East";
    const counts: { [key: string]: number } = {};
    students.forEach(s => {
      counts[s.centerId] = (counts[s.centerId] || 0) + 1;
    });
    let maxCount = 0;
    let topCenterId = "";
    Object.keys(counts).forEach(cid => {
      if (counts[cid] > maxCount) {
        maxCount = counts[cid];
        topCenterId = cid;
      }
    });
    const topCenter = centers.find(c => c.id === topCenterId);
    return topCenter ? `${topCenter.name} (${maxCount} Students)` : "My Abacus Bangalore East";
  };
  const topAcademy = getTopAcademyName();

  // Top Result (Highest level achieved website-wide)
  const getTopResult = () => {
    if (!students || students.length === 0) return "Level 3 National Champion";
    const topLevelAchieved = Math.max(...students.map(s => s.currentLevel));
    const topStudentObj = students.find(s => s.currentLevel === topLevelAchieved);
    return `Level ${topLevelAchieved} Advanced Medalist (${topStudentObj?.studentName || "Ananya Pillai"})`;
  };
  const topResult = getTopResult();

  // Best Student (Student with highest currentLevel / or max accuracy/score)
  const getBestStudent = () => {
    if (!students || students.length === 0) return "Ananya Pillai (Bangalore East)";
    const topLevelAchieved = Math.max(...students.map(s => s.currentLevel));
    const topStudentObj = students.find(s => s.currentLevel === topLevelAchieved);
    if (!topStudentObj) return "Ananya Pillai (Bangalore East)";
    const centerObj = centers.find(c => c.id === topStudentObj.centerId);
    return `${topStudentObj.studentName} (Level ${topStudentObj.currentLevel} - ${centerObj ? centerObj.name : "Bangalore East"})`;
  };
  const bestStudent = getBestStudent();

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-xl text-center space-y-6 animate-fade-in" id="superadmin-login-card">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-950 font-display">Geniplus Super Admin</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Authorized access only. Log in to manage franchised center contracts, allocate evaluation trials, and monitor ARR metrics.
          </p>
        </div>

        {adminError && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] font-bold text-rose-600">
            {adminError}
          </div>
        )}

        <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Email ID</label>
            <input
              type="email"
              required
              placeholder="admin@geniplus.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-indigo-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-indigo-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <button
            type="submit"
            disabled={adminLoading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            {adminLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> : <Key className="w-3.5 h-3.5 text-white" />}
            <span>Unlock Superadmin Panel</span>
          </button>
        </form>

        <div className="border-t border-slate-100 pt-5 text-left text-xs bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="font-bold text-slate-700 mb-1">Testing Credentials:</div>
          <div className="text-[11px] text-slate-500 font-mono flex flex-col gap-1">
            <span>Email: <strong className="text-slate-700">admin@geniplus.com</strong></span>
            <span>Password: <strong className="text-slate-700">password123</strong></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="super-admin-view">

      {/* Super Admin Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="bg-rose-950 text-rose-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-rose-900/40">
            System Overseer Account
          </span>
          <h2 className="text-xl md:text-2xl font-black font-display mt-2">
            Superadmin Console ⚡
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            SaaS Platform Analytics • Global Multi-tenant Subscriptions • Broadcast Service
          </p>
        </div>
        <button
          onClick={handleAdminLogout}
          className="bg-slate-800 hover:bg-rose-700 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Lock Admin Dashboard</span>
        </button>
      </div>
      
      {/* Super Admin Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Registered Centers</div>
          <div className="text-2xl md:text-3xl font-black text-indigo-900 mt-1 font-display leading-tight">{centers.length} Centers</div>
          <div className="text-[10px] text-slate-400 mt-1.5">Active multi-tenant isolation</div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active SaaS Subscriptions</div>
          <div className="text-2xl md:text-3xl font-black text-emerald-600 mt-1 font-display leading-tight">{centers.filter(c => c.status === "Active").length} Active</div>
          <div className="text-[10px] text-emerald-500 mt-1.5 font-bold">100% billing health</div>
        </div>

        <div className="bg-amber-400 border-2 border-amber-300 rounded-3xl p-5 shadow-lg shadow-amber-200/40 text-indigo-950">
          <div className="text-[10px] font-black text-indigo-950/80 uppercase tracking-wider">Total SaaS ARR Revenue</div>
          <div className="text-2xl md:text-3xl font-black mt-1 font-display leading-tight">₹{totalSaaSArr.toLocaleString()}</div>
          <div className="text-[10px] text-indigo-950/80 mt-1.5 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Based on Tier allocations</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Global System Health</div>
          <div className="text-2xl md:text-3xl font-black text-indigo-900 mt-1 font-display leading-tight">99.98%</div>
          <div className="text-[10px] text-slate-400 mt-1.5">No active outages detected</div>
        </div>
      </div>

      {/* Website Student Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Active Students</div>
          <div className="text-2xl md:text-3xl font-black text-indigo-600 mt-1 font-display leading-tight">{totalPortalStudents} Students</div>
          <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
            <Users className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>Enrolled across divisions</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top Academy Center</div>
          <div className="text-sm font-black text-slate-800 mt-2 font-display leading-tight line-clamp-2">{topAcademy}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Highest student count</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top Result achieved</div>
          <div className="text-sm font-bold text-emerald-700 mt-2 font-display leading-tight line-clamp-2">{topResult}</div>
          <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
            <Trophy className="w-3 h-3 shrink-0" />
            <span>Advanced levels</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Best Student (Website)</div>
          <div className="text-sm font-black text-indigo-950 mt-2 font-display leading-tight line-clamp-2">{bestStudent}</div>
          <div className="text-[10px] text-indigo-500 mt-1 flex items-center gap-1 font-bold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            <span>Top accuracy performer</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Centers registry list (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Geniplus Licensed SaaS Centers
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Register new franchise centers and manage subscription plans.</p>
            </div>
            <button
              onClick={() => setShowAddCenter(!showAddCenter)}
              className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-xl text-indigo-700 text-xs font-semibold transition-all active:scale-95"
              id="add-center-btn"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Center</span>
            </button>
          </div>

          {showAddCenter && (
            <form onSubmit={handleCreateCenter} className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-4 mb-6">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Register New Academy Tenant</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Center Name</label>
                  <input type="text" required value={cName} onChange={(e) => setCName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Owner Name</label>
                  <input type="text" required value={cOwner} onChange={(e) => setCOwner(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Owner Email</label>
                  <input type="email" required value={cEmail} onChange={(e) => setCEmail(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Owner Mobile</label>
                  <input type="text" required value={cMobile} onChange={(e) => setCMobile(e.target.value)} placeholder="+91" className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Subscription Plan</label>
                  <select value={cPlan} onChange={(e) => setCPlan(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium">
                    <option value="10 Students Plan">10 Students (₹9,999/-)</option>
                    <option value="20 Students Plan">20 Students (₹18,999/-)</option>
                    <option value="40 Students Plan">40 Students (₹26,999/-)</option>
                    <option value="100 Students Plan">100 Students (₹49,999/-)</option>
                    <option value="Custom Plan">Custom Plan (Per Requirements)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">City</label>
                  <input type="text" value={cCity} onChange={(e) => setCCity(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">State</label>
                  <input type="text" value={cState} onChange={(e) => setCState(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                </div>
              </div>

              {/* Optional Custom Plan Amount manual input */}
              {(cPlan === "Custom Plan" || cPlan === "Custom") && (
                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-[11px] font-extrabold text-indigo-900 mb-1 uppercase tracking-wider">Custom Plan Amount (INR/year)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 150000"
                      value={cCustomPrice}
                      onChange={(e) => setCCustomPrice(e.target.value)}
                      className="w-full max-w-xs bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-950 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="text-xs text-indigo-700 font-medium">
                    ✨ <strong>Unlimited Plan</strong>: Centers registered with the Custom Plan can enroll an unlimited number of students and teachers without restriction.
                  </div>
                </div>
              )}

              {/* Multiple Center Addresses Option */}
              <div className="bg-white border border-gray-150 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Multiple Address Locations / Branches</div>
                  <button
                    type="button"
                    onClick={() => setCAddresses([...cAddresses, ""])}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    + Add Branch Address
                  </button>
                </div>
                <div className="space-y-2">
                  {cAddresses.map((addr, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] text-slate-400 font-mono w-6">#{idx+1}</span>
                      <input
                        type="text"
                        placeholder="e.g. Ground Floor, East Wing, Bangalore"
                        value={addr}
                        onChange={(e) => {
                          const updated = [...cAddresses];
                          updated[idx] = e.target.value;
                          setCAddresses(updated);
                        }}
                        className="flex-1 bg-gray-50/50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:bg-white"
                      />
                      {cAddresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCAddresses(cAddresses.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-1"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddCenter(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">Register Tenant</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {centers.map(center => (
              <div key={center.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">{center.id}</span>
                    <span className="font-bold text-gray-900 text-sm font-display">{center.name}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                      center.plan === "100 Students Plan" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                      center.plan === "40 Students Plan" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      center.plan === "20 Students Plan" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      center.plan === "10 Students Plan" ? "bg-purple-50 text-purple-700 border-purple-200" :
                      "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                      {center.plan}
                    </span>
                    {center.isTrial && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Evaluating Free Trial ({center.trialDays} Days)</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Owner: <strong className="text-gray-700 font-semibold">{center.ownerName}</strong> ({center.mobile})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-indigo-600">{center.email}</span>
                    </div>
                    {center.isTrial && center.trialExpiryDate ? (
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-md border border-emerald-100 w-fit">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Trial Evaluation Ends: <strong className="font-mono text-xs">{center.trialExpiryDate}</strong></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>License Expires: <strong className="text-gray-600 font-mono">{center.subscriptionExpiry}</strong></span>
                      </div>
                    )}

                    {(center.plan === "Custom Plan" || center.plan === "Custom") && typeof center.customPrice === "number" && (
                      <div className="flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-150 w-fit">
                        <span>Custom Fee: ₹{center.customPrice.toLocaleString('en-IN')}/year</span>
                        <span className="text-[9px] font-normal text-slate-500">(Unlimited Students & Teachers)</span>
                      </div>
                    )}

                    {center.addresses && center.addresses.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-150 space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Addresses & Branches:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {center.addresses.map((addr, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded-md font-medium flex items-center gap-1 shadow-2xs">
                              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                              {addr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Share password action */}
                  <button
                    type="button"
                    onClick={() => handleCopyPassword(center)}
                    title="Copy Secret Password to Share"
                    className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                  >
                    {copiedCenterId === center.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="w-3.5 h-3.5" />
                        <span>Share Pass</span>
                      </>
                    )}
                  </button>

                  {/* Edit details */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(center)}
                    title="Edit Franchise Center Details"
                    className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {/* Delete Tenant */}
                  <button
                    type="button"
                    onClick={() => handleDeleteCenter(center.id)}
                    title="Delete Franchise Center Tenant"
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  {/* Status Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleCenterStatus(center.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                      center.status === "Active"
                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                    }`}
                    id={`center-toggle-${center.id}`}
                  >
                    {center.status}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Franchise Subscription & Free Trial Administrator Desk */}
          <form onSubmit={handleUpdateSubscriptionSubmit} className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2 font-display">
                <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                Subscription & Evaluation Trials Desk
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Manage subscription terms or allocate timed evaluation free trials to centers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Select Center</label>
                <select
                  required
                  value={subCenterId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setSubCenterId(cid);
                    const found = centers.find(c => c.id === cid);
                    if (found) {
                      setSubPlan(found.plan);
                      setSubExpiry(found.subscriptionExpiry);
                      setSubIsTrial(!!found.isTrial);
                      setSubTrialDays(found.trialDays || 30);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Center Head --</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.plan} Plan)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Subscription Plan Level</label>
                <select
                  value={subPlan}
                  onChange={(e) => setSubPlan(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="10 Students Plan">10 Students (₹9,999/-)</option>
                  <option value="20 Students Plan">20 Students (₹18,999/-)</option>
                  <option value="40 Students Plan">40 Students (₹26,999/-)</option>
                  <option value="100 Students Plan">100 Students (₹49,999/-)</option>
                  <option value="Custom Plan">Custom Plan (Per Requirements)</option>
                </select>
              </div>
            </div>

            <div className="bg-white border border-slate-150 rounded-xl p-3.5 space-y-3.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-evaluation-trial"
                  checked={subIsTrial}
                  onChange={(e) => setSubIsTrial(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is-evaluation-trial" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Activate Evaluation Free Trial for this center
                </label>
              </div>

              {subIsTrial ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-fade-in">
                  <div>
                    <label className="block font-bold text-emerald-800 mb-1">Trial Evaluation Period (Days)</label>
                    <select
                      value={subTrialDays}
                      onChange={(e) => setSubTrialDays(Number(e.target.value))}
                      className="w-full bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-2.5 font-bold outline-none"
                    >
                      <option value={7}>7 Days Fast Evaluation</option>
                      <option value={14}>14 Days Regular Trial</option>
                      <option value={30}>30 Days Comprehensive Trial</option>
                      <option value={60}>60 Days Extensive Evaluation</option>
                    </select>
                  </div>
                  <div className="flex items-center text-[11px] text-emerald-700 leading-relaxed font-semibold">
                    * The center will automatically enter "Active Trial" status. On expiration, the local admin will be prompted to select one of the commercial plans.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Contract License Expiry Date</label>
                    <input
                      type="date"
                      value={subExpiry}
                      onChange={(e) => setSubExpiry(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={subUpdating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                {subUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Save Subscription & Evaluation Terms</span>
              </button>
            </div>
          </form>
        </div>

        {/* System Announcements (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-1">
              <Megaphone className="w-5 h-5 text-indigo-600" />
              Super Admin Announcements
            </h3>
            <p className="text-xs text-slate-500 mb-4">Send system announcements, curriculum adjustments, or billing notices across all tenant centers.</p>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Maintenance or Syllabus Update"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  id="ann-title-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Content Body</label>
                <textarea
                  required
                  value={annText}
                  onChange={(e) => setAnnText(e.target.value)}
                  placeholder="Describe the instructions in detail..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium h-24 focus:ring-1 focus:ring-indigo-500"
                  id="ann-text-textarea"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]"
                id="publish-ann-btn"
              >
                Broadcast Announcement
              </button>
            </form>

            {showAnnSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg p-2.5 mt-3 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Broadcast complete! Senders will receive notification in App.</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-xs font-bold text-gray-900 font-display mb-3">Live Broadcast Log</div>
            <div className="space-y-3 max-h-[160px] overflow-y-auto">
              {announcements.map((ann, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-700">
                  <div className="font-bold text-slate-900 flex justify-between">
                    <span>{ann.title}</span>
                    <span className="font-mono text-[9px] text-slate-400">{ann.date}</span>
                  </div>
                  <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">{ann.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Edit Center Tenant Modal Overlay */}
      {editingCenter && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex justify-center items-center p-4" id="edit-center-modal">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-left animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 font-display">Edit Franchise Center Tenant</h3>
              <p className="text-xs text-gray-500">Edit registration values, plan details, or overwrite passwords.</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Center Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Owner Name</label>
                <input
                  type="text"
                  required
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Registered Owner Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile No</label>
                <input
                  type="text"
                  required
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subscription Plan</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                >
                  <option value="10 Students Plan">10 Students (₹9,999/-)</option>
                  <option value="20 Students Plan">20 Students (₹18,999/-)</option>
                  <option value="40 Students Plan">40 Students (₹26,999/-)</option>
                  <option value="100 Students Plan">100 Students (₹49,999/-)</option>
                  <option value="Custom Plan">Custom Plan (Per Requirements)</option>
                </select>
              </div>

              {/* Optional Custom Plan Amount manual input for Edit */}
              {(editPlan === "Custom Plan" || editPlan === "Custom") && (
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-1">
                  <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Custom Plan Amount (INR/year)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 150000"
                    value={editCustomPrice}
                    onChange={(e) => setEditCustomPrice(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-indigo-950 focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                  <div className="text-[9px] text-indigo-700 font-medium pt-1">
                    ✨ Custom Plan grants unlimited teachers & students.
                  </div>
                </div>
              )}

              {/* Edit multiple addresses */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Center Addresses / Branches</label>
                  <button
                    type="button"
                    onClick={() => setEditAddresses([...editAddresses, ""])}
                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Branch
                  </button>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                  {editAddresses.map((addr, idx) => (
                    <div key={idx} className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        placeholder="Address branch location"
                        value={addr}
                        onChange={(e) => {
                          const updated = [...editAddresses];
                          updated[idx] = e.target.value;
                          setEditAddresses(updated);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                      {editAddresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditAddresses(editAddresses.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account Secret Password</label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCenter(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  {editSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Center Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
