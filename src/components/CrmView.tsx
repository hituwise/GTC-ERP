import React, { useState, useEffect } from "react";
import { CRMLead, Teacher, Center } from "../types";
import { PhoneCall, UserPlus, Clock, Share2, ExternalLink, FileCode, Check, Copy, Database, HelpCircle, Trash2, ArrowRight, RefreshCw, Plus, Palette, MessageSquare, MessageCircle, Calendar, Video, Phone, AlertCircle, AlertTriangle, FileText, History, LayoutGrid, List, Sparkles, Link, Code, ChevronDown, ChevronUp, Layers, SlidersHorizontal, Search, FileSpreadsheet, Pencil, Loader2 } from "lucide-react";

interface CrmViewProps {
  leads: CRMLead[];
  onAddLead: (lead: Partial<CRMLead>) => void;
  currentUser?: any;
  currentRole?: string;
  teachers?: Teacher[];
  centers?: Center[];
}

export default function CrmView({ leads, onAddLead, currentUser, currentRole, teachers, centers = [] }: CrmViewProps) {
  const userRole = currentRole || currentUser?.role || "";
  
  // Robust center ID resolution to prevent leakage to C001
  const resolveUserCenterId = () => {
    if (currentUser?.centerId) return currentUser.centerId;
    if (currentUser?.id) {
      if (currentUser.id.startsWith("C")) return currentUser.id;
      if (currentUser.id.startsWith("T_C_")) return currentUser.id.replace("T_C_", "");
    }
    try {
      const saved = localStorage.getItem("erp_logged_in_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.centerId) return parsed.centerId;
        if (parsed?.id) {
          if (parsed.id.startsWith("C")) return parsed.id;
          if (parsed.id.startsWith("T_C_")) return parsed.id.replace("T_C_", "");
        }
      }
    } catch (e) {}
    return "C001";
  };

  const userCenterId = resolveUserCenterId();

  const logActivity = (action: string, details: string, centerId?: string) => {
    try {
      fetch("/api/erp/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, details, centerId: centerId || userCenterId, user: currentUser?.name || "Center Admin" })
      }).catch(() => {});
    } catch (e) {}
  };

  const safeLeads = Array.isArray(leads) ? leads : [];
  const isSuperAdmin = userRole === "Super Admin";

  // Filter out blank dummy leads ("New Enquirer" without phone, email, or parent name)
  const validLeads = safeLeads.filter(l => {
    if (!l) return false;
    const isDummyName = !l.name || l.name.trim() === "" || l.name === "New Enquirer";
    const hasNoPhone = !l.parentMobile || !l.parentMobile.trim();
    const hasNoEmail = !l.email || !l.email.trim();
    const hasNoParentName = !l.parentName || !l.parentName.trim() || l.parentName === "Parent";
    if (isDummyName && hasNoPhone && hasNoEmail && hasNoParentName) {
      return false;
    }
    return true;
  });

  // Branch list resolution for CRM leads (isolating leads per branch)
  const crmBranchList = React.useMemo(() => {
    if (!centers || centers.length === 0) {
      return [{ id: userCenterId || "C001", name: "Main Center", parentCenterId: null, isSuperCenter: true }];
    }
    if (isSuperAdmin) {
      return centers;
    }
    const currentCenterObj = centers.find(c => c.id === userCenterId);
    const isMainCenterOwner = (userRole === "Center Admin" || userRole === "Manager + Teacher") && currentCenterObj && (!currentCenterObj.parentCenterId || currentCenterObj.parentCenterId === currentCenterObj.id || (currentCenterObj as any).isSuperCenterOwner === true || (currentCenterObj as any).isSuperCenter === true);
    
    if (isMainCenterOwner) {
      const relatedCenters = centers.filter(c => c.id === userCenterId || c.parentCenterId === userCenterId);
      return relatedCenters.length > 0 ? relatedCenters : (currentCenterObj ? [currentCenterObj] : centers);
    }
    
    return currentCenterObj ? [currentCenterObj] : [{ id: userCenterId || "C001", name: "My Center", parentCenterId: null, isSuperCenter: false }];
  }, [centers, userCenterId, isSuperAdmin, userRole]);

  // Branch filter state for separate lead pipeline views
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(userCenterId || "C001");

  // Filter based on center-level data isolation & separate branch filtering
  const filteredByCenter = validLeads.filter(l => {
    if (!l) return false;
    if (selectedBranchFilter === "ALL") {
      if (isSuperAdmin) return true;
      const allowedIds = crmBranchList.map(b => b.id);
      return allowedIds.includes(l.centerId) || (Array.isArray(l.sharedCenterIds) && l.sharedCenterIds.some(id => allowedIds.includes(id)));
    }
    // Strict separate branch visibility: show leads specifically belonging to or shared with selected branch
    return l.centerId === selectedBranchFilter || (Array.isArray(l.sharedCenterIds) && l.sharedCenterIds.includes(selectedBranchFilter));
  });

  const authorizedLeads = filteredByCenter;

  const [localLeads, setLocalLeads] = useState<CRMLead[]>(authorizedLeads);

  useEffect(() => {
    setLocalLeads(filteredByCenter);
  }, [leads, selectedBranchFilter, userCenterId, isSuperAdmin, currentUser, currentRole]);

  const logCrmActivity = async (action: string, details: string) => {
    try {
      await fetch("/api/erp/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: currentUser?.name || "CRM Representative",
          role: currentRole || currentUser?.role || "Center Admin",
          action,
          centerId: currentUser?.centerId || "C001",
          centerName: currentUser?.centerName || "Main Center",
          details
        })
      });
    } catch (e) {
      console.error("Failed to log CRM action", e);
    }
  };

  // CRM Sub-tab menu: "pipeline" | "integrations" | "calendar" | "marketing"
  const [crmTab, setCrmTab] = useState<"pipeline" | "integrations" | "calendar" | "marketing">("pipeline");
  
  // Pipeline View Mode: "compact" (normal list view with essential front fields) vs "kanban"
  const [leadDisplayMode, setLeadDisplayMode] = useState<"compact" | "kanban">("compact");
  
  // Track expanded lead cards in compact view
  const [expandedLeadIds, setExpandedLeadIds] = useState<Record<string, boolean>>({});

  const toggleLeadExpanded = (leadId: string) => {
    setExpandedLeadIds(prev => ({ ...prev, [leadId]: !prev[leadId] }));
  };

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");
  
  // Timezone simulator: "local", "IST" (India), "EST" (USA), "GST" (UAE)
  const [selectedTimezone, setSelectedTimezone] = useState<"local" | "IST" | "EST" | "GST">((currentUser?.timezone as any) || "local");

  useEffect(() => {
    if (currentUser?.timezone) {
      setSelectedTimezone(currentUser.timezone as any);
    }
  }, [currentUser]);

  // CRM Calendar State Variables
  const [activeMonth, setActiveMonth] = useState(6); // July (0-indexed)
  const [activeYear, setActiveYear] = useState(2026);
  const [calendarViewMode, setCalendarViewMode] = useState<"day" | "week" | "month">("month");
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>("2026-07-14");
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<any | null>(null);
  
  // Notification Sub-Tab state: "today" | "overdue" | "upcoming"
  const [notifSubTab, setNotifSubTab] = useState<"today" | "overdue" | "upcoming">("today");

  // Integrations & Form State
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);

  const getFormShareableUrl = () => {
    return `${window.location.origin}/#public-enquiry-form?centerId=${currentUser?.centerId || "C001"}`;
  };

  const handleCopyFormUrl = () => {
    navigator.clipboard.writeText(getFormShareableUrl());
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSyncToGoogleSheet = async () => {
    if (!googleSheetUrl) return;
    setIsSyncingSheet(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      alert("CRM leads successfully synced to Google Sheet!");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // AI Function 3: Parent Counsellor & Doubt Resolver
  const [counselQuery, setCounselQuery] = useState("Parent is concerned that a 5-year-old child is too young for Abacus and might get confused with school math.");
  const [counselLoading, setCounselLoading] = useState(false);
  const [counselOutput, setCounselOutput] = useState("");

  // AI Function 4: Custom Marketing Campaign Generator
  const [marketingPlatform, setMarketingPlatform] = useState("WhatsApp");
  const [marketingGoal, setMarketingGoal] = useState("Drive free trial class bookings for weekend batch");
  const [marketingKeywords, setMarketingKeywords] = useState("Abacus, Mental Math, Speed Calculation, Memory Boost, ISO Certified");
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [marketingOutput, setMarketingOutput] = useState("");

  // AI Function 5: Sales Coach & Objection Handler
  const [salesScenario, setSalesScenario] = useState("Parent phone follow-up call after trial class");
  const [salesObjection, setSalesObjection] = useState("Fees are too high / want discount or need to consult spouse first");
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesOutput, setSalesOutput] = useState("");

  const handleRunCounsel = async () => {
    if (!counselQuery.trim()) return;
    setCounselLoading(true);
    try {
      const res = await fetch("/api/gemini/counsel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: counselQuery })
      });
      const data = await res.json();
      if (data.text) {
        setCounselOutput(data.text);
      } else {
        setCounselOutput("Could not generate counsel advice. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setCounselOutput("Error connecting to AI service.");
    } finally {
      setCounselLoading(false);
    }
  };

  const handleRunMarketing = async () => {
    setMarketingLoading(true);
    try {
      const res = await fetch("/api/gemini/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: marketingPlatform, goal: marketingGoal, keywords: marketingKeywords })
      });
      const data = await res.json();
      if (data.text) {
        setMarketingOutput(data.text);
      } else {
        setMarketingOutput("Could not generate marketing copy. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setMarketingOutput("Error connecting to AI service.");
    } finally {
      setMarketingLoading(false);
    }
  };

  const handleRunSales = async () => {
    if (!salesObjection.trim()) return;
    setSalesLoading(true);
    try {
      const res = await fetch("/api/gemini/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: salesScenario, objection: salesObjection })
      });
      const data = await res.json();
      if (data.text) {
        setSalesOutput(data.text);
      } else {
        setSalesOutput("Could not generate sales response. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setSalesOutput("Error connecting to AI service.");
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    setLocalLeads(authorizedLeads);
  }, [leads, currentUser, currentRole]);
  const [showAddLead, setShowAddLead] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const getTimezoneOffset = (tz: string) => {
    switch (tz) {
      case "IST": return 5.5; // India +5:30
      case "EST": return -5;  // USA Eastern Standard -5:00
      case "GST": return 4;   // UAE +4:00
      default: return null;
    }
  };

  const getSimulatedCurrentTime = () => {
    const d = new Date();
    const offset = getTimezoneOffset(selectedTimezone);
    if (offset === null) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (3600000 * offset));
    return nd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) + ` (${selectedTimezone})`;
  };

  const getSimulatedTimeString = (timeStr: string, dateStr?: string) => {
    if (!timeStr) return "";
    const offset = getTimezoneOffset(selectedTimezone);
    if (offset === null) return timeStr;

    try {
      let hours = 12;
      let minutes = 0;
      if (timeStr.includes(":")) {
        const parts = timeStr.split(":");
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1] || "0", 10);
      } else {
        return timeStr;
      }

      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const nd = new Date(utc + (3600000 * offset));
      return nd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return timeStr;
    }
  };

  const getLocalTodayDateString = () => {
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatToLocalTime = (isoString: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      
      const today = new Date();
      const isToday = date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
                      
      const timeStr = date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      
      if (isToday) {
        return `Today at ${timeStr}`;
      }
      
      return `${date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      })} at ${timeStr}`;
    } catch {
      return isoString;
    }
  };

  // Teachers list management
  const [localTeachers, setLocalTeachers] = useState<Teacher[]>(teachers || []);
  const [filterTeacherId, setFilterTeacherId] = useState<string>("All");

  useEffect(() => {
    setLocalTeachers(teachers || []);
  }, [teachers]);

  // Form fields for internal manual registration
  const [newLeadCenterId, setNewLeadCenterId] = useState<string>(userCenterId || "C001");
  const [newLeadName, setNewLeadName] = useState("");
  const [newParentName, setNewParentName] = useState("");
  const [newParentMobile, setNewParentMobile] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newSource, setNewSource] = useState("Walk-In");
  const [newCampaign, setNewCampaign] = useState("Direct Enquiry");
  const [newRemarks, setNewRemarks] = useState("");
  const [newAssignedTeacherId, setNewAssignedTeacherId] = useState("");

  // Edit Lead Modal State
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentName, setEditParentName] = useState("");
  const [editParentMobile, setEditParentMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSource, setEditSource] = useState("Walk-In");
  const [editCampaign, setEditCampaign] = useState("Direct Enquiry");
  const [editStatus, setEditStatus] = useState("New Lead");
  const [editCounsellor, setEditCounsellor] = useState("Staff");
  const [editFollowupDate, setEditFollowupDate] = useState("");
  const [editFollowupTime, setEditFollowupTime] = useState("");
  const [editDemoDate, setEditDemoDate] = useState("");
  const [editDemoTime, setEditDemoTime] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editAssignedTeacherId, setEditAssignedTeacherId] = useState("");
  const [editSharedCenterIds, setEditSharedCenterIds] = useState<string[]>([]);

  const openEditLeadModal = (lead: CRMLead) => {
    setEditingLead(lead);
    setEditName(lead.name || "");
    setEditParentName(lead.parentName || "");
    setEditParentMobile(lead.parentMobile || "");
    setEditEmail(lead.email || "");
    setEditSource(lead.source || "Walk-In");
    setEditCampaign(lead.campaign || "Direct Enquiry");
    setEditStatus(lead.status || "New Lead");
    setEditCounsellor(lead.counsellor || "Staff");
    setEditFollowupDate(lead.followupDate || "");
    setEditFollowupTime(lead.followupTime || "10:00");
    setEditDemoDate(lead.demoRescheduleDate || "");
    setEditDemoTime(lead.demoRescheduleTime || "");
    setEditRemarks(lead.remarks || "");
    setEditAssignedTeacherId(lead.assignedTeacherId || "");
    setEditSharedCenterIds(lead.sharedCenterIds || []);
  };

  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    const matchedTeacherObj = localTeachers.find(t => t.id === editAssignedTeacherId);

    const payload = {
      leadId: editingLead.id,
      name: editName,
      parentName: editParentName,
      parentMobile: editParentMobile,
      email: editEmail,
      source: editSource,
      campaign: editCampaign,
      status: editStatus,
      counsellor: editCounsellor,
      followupDate: editFollowupDate,
      followupTime: editFollowupTime,
      demoRescheduleDate: editDemoDate,
      demoRescheduleTime: editDemoTime,
      remarks: editRemarks,
      assignedTeacherId: editAssignedTeacherId,
      assignedTeacherName: matchedTeacherObj?.name || "",
      sharedCenterIds: editSharedCenterIds
    };

    try {
      const res = await fetch("/api/erp/update-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.lead) {
        setLocalLeads(prev => prev.map(l => l.id === editingLead.id ? data.lead : l));
        logActivity("Lead Update", `Updated details for lead: ${editName} (${editingLead.id})`, editingLead.centerId);
      }
    } catch (err) {
      console.error("Error updating lead:", err);
    }

    setEditingLead(null);
  };

  // Parent form simulator states
  const [simName, setSimName] = useState("");
  const [simAge, setSimAge] = useState("");
  const [simParent, setSimParent] = useState("");
  const [simMobile, setSimMobile] = useState("");
  const [simTiming, setSimTiming] = useState("");
  const [simRemarks, setSimRemarks] = useState("");
  const [simSubmitted, setSimSubmitted] = useState(false);

  // Integrations persistent settings
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedRawHtml, setCopiedRawHtml] = useState(false);

  // Custom Public Form Management States (2 Editable Forms)
  const [activeFormId, setActiveFormId] = useState<string>("1"); // Ticked active form for main URL ("1" or "2")
  const [editingFormTab, setEditingFormTab] = useState<string>("1"); // Tab selected for editing ("1" or "2")

  const [formsData, setFormsData] = useState<Record<string, {
    id: string;
    name?: string;
    badgeText: string;
    heading: string;
    subtext: string;
    imageUrl: string;
    btnText: string;
    btnBgColor: string;
    btnTextColor: string;
    redirectUrl: string;
    timingTitle?: string;
    timingDisplayMode?: "dropdown" | "info_box" | "hidden";
    infoBoxText?: string;
    timings: string[];
    autoSelectTiming: boolean;
    footerText: string;
    campaignName: string;
  }>>({
    "1": {
      id: "1",
      name: "Form 1 (Trial Demo Session)",
      badgeText: "FREE ABACUS TRIAL & DEMO SESSION",
      heading: "RESERVE YOUR CHILD'S FREE SEAT NOW!",
      subtext: "Reserve Your Child's FREE Seat Now! 30-Day Online Abacus Challenge For Children Age 7-14 Years",
      imageUrl: "",
      btnText: "REGISTER MY CHILD'S TRIAL SESSION 🚀",
      btnBgColor: "#dc2626",
      btnTextColor: "#ffffff",
      redirectUrl: "",
      timingTitle: "Preferred Demo Timing",
      timingDisplayMode: "dropdown",
      infoBoxText: "📅 LIVE CLASS SCHEDULE\nStarts 1st August 2026\nSaturday: 6:00 PM – 7:00 PM\nSunday: 10:00 AM – 11:00 AM\n💻 Live Online on Zoom",
      timings: [
        "Saturday Morning (10:00 AM - 11:30 AM)",
        "Saturday Evening (4:00 PM - 5:30 PM)",
        "Sunday Morning (10:00 AM - 11:30 AM)",
        "Sunday Evening (4:00 PM - 5:30 PM)",
        "Weekday Online Evening (6:00 PM - 7:00 PM)"
      ],
      autoSelectTiming: true,
      footerText: "By registering, you agree to receive trial confirmation alerts on your contact number.",
      campaignName: "Trial Demo Form 1"
    },
    "2": {
      id: "2",
      name: "Form 2 (Special Camp / Workshop)",
      badgeText: "🔥 LIMITED TIME SPECIAL DEMO",
      heading: "BOOK YOUR CHILD'S SPECIAL ABACUS WORKSHOP!",
      subtext: "Transform your child's math speed & confidence with our expert interactive 1-on-1 session.",
      imageUrl: "",
      btnText: "CLAIM MY FREE DEMO SLOT NOW 🎯",
      btnBgColor: "#2563eb",
      btnTextColor: "#ffffff",
      redirectUrl: "",
      timingTitle: "Live Class Schedule",
      timingDisplayMode: "info_box",
      infoBoxText: "📅 LIVE CLASS SCHEDULE\nStarts 1st August 2026\nSaturday: 6:00 PM – 7:00 PM\nSunday: 10:00 AM – 11:00 AM\n💻 Live Online on Zoom",
      timings: [
        "Weekend Batch (11:00 AM - 12:30 PM)",
        "Evening Express Batch (5:00 PM - 6:00 PM)"
      ],
      autoSelectTiming: true,
      footerText: "Instant confirmation via WhatsApp & Email.",
      campaignName: "Special Camp Form 2"
    }
  });

  const [newTimingInput, setNewTimingInput] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const currentEditingForm = formsData[editingFormTab] || formsData["1"];

  // Helper getters for backward compatibility
  const formTimings = currentEditingForm.timings || [];
  const formHeading = currentEditingForm.heading || "";
  const formSubtext = currentEditingForm.subtext || "";
  const formBtnBg = currentEditingForm.btnBgColor || "#dc2626";
  const formBtnText = currentEditingForm.btnTextColor || "#ffffff";

  const updateFormData = (field: string, value: any) => {
    const targetTab = editingFormTab || "1";
    setFormsData(prev => ({
      ...prev,
      [targetTab]: {
        ...(prev[targetTab] || (targetTab === "2" ? {
          id: "2",
          badgeText: "🔥 LIMITED TIME SPECIAL DEMO",
          heading: "BOOK YOUR CHILD'S SPECIAL ABACUS WORKSHOP!",
          subtext: "Transform your child's math speed & confidence with our expert interactive 1-on-1 session.",
          imageUrl: "",
          btnText: "CLAIM MY FREE DEMO SLOT NOW 🎯",
          btnBgColor: "#2563eb",
          btnTextColor: "#ffffff",
          redirectUrl: "",
          timingTitle: "Live Class Schedule",
          timingDisplayMode: "info_box",
          infoBoxText: "📅 LIVE CLASS SCHEDULE\nStarts 1st August 2026\nSaturday: 6:00 PM – 7:00 PM\nSunday: 10:00 AM – 11:00 AM\n💻 Live Online on Zoom",
          timings: ["Weekend Batch (11:00 AM - 12:30 PM)", "Evening Express Batch (5:00 PM - 6:00 PM)"],
          autoSelectTiming: true,
          footerText: "Instant confirmation via WhatsApp & Email.",
          campaignName: "Special Camp Form 2"
        } : {
          id: "1",
          badgeText: "FREE ABACUS TRIAL & DEMO SESSION",
          heading: "RESERVE YOUR CHILD'S FREE SEAT NOW!",
          subtext: "Reserve Your Child's FREE Seat Now! 30-Day Online Abacus Challenge For Children Age 7-14 Years",
          imageUrl: "",
          btnText: "REGISTER MY CHILD'S TRIAL SESSION 🚀",
          btnBgColor: "#dc2626",
          btnTextColor: "#ffffff",
          redirectUrl: "",
          timingTitle: "Preferred Demo Timing",
          timingDisplayMode: "dropdown",
          infoBoxText: "📅 LIVE CLASS SCHEDULE\nStarts 1st August 2026\nSaturday: 6:00 PM – 7:00 PM\nSunday: 10:00 AM – 11:00 AM\n💻 Live Online on Zoom",
          timings: ["Saturday Morning (10:00 AM - 11:30 AM)", "Saturday Evening (4:00 PM - 5:30 PM)", "Sunday Morning (10:00 AM - 11:30 AM)", "Sunday Evening (4:00 PM - 5:30 PM)", "Weekday Online Evening (6:00 PM - 7:00 PM)"],
          autoSelectTiming: true,
          footerText: "By registering, you agree to receive trial confirmation alerts on your contact number.",
          campaignName: "Trial Demo Form 1"
        })),
        [field]: value
      }
    }));
  };

  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  // Load parent form configuration on mount
  useEffect(() => {
    const centerParam = userCenterId ? `?centerId=${userCenterId}` : "";
    fetch(`/api/erp/form-config${centerParam}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.centerConfig) {
            if (data.centerConfig.forms) {
              setFormsData(prev => ({
                "1": { ...prev["1"], ...(data.centerConfig.forms["1"] || {}) },
                "2": { ...prev["2"], ...(data.centerConfig.forms["2"] || {}) }
              }));
            }
            if (data.centerConfig.activeFormId) {
              setActiveFormId(data.centerConfig.activeFormId);
            }
            if (data.centerConfig.spreadsheetId) {
              setSpreadsheetId(data.centerConfig.spreadsheetId);
            }
          } else if (data.config) {
            setFormsData(prev => ({
              ...prev,
              "1": { ...prev["1"], ...data.config }
            }));
          }
        }
      })
      .catch(err => console.error("Error loading form config in CRM:", err));
  }, [userCenterId]);

  const handleSaveFormConfig = async (e?: React.FormEvent, overrideActiveId?: string) => {
    if (e) e.preventDefault();
    const targetActiveId = overrideActiveId !== undefined ? overrideActiveId : activeFormId;
    if (overrideActiveId !== undefined) {
      setActiveFormId(overrideActiveId);
    }
    setSaveStatus("Saving form settings...");
    const targetTab = editingFormTab || "1";
    const cur = formsData[targetTab] || formsData["1"];
    const updatedFormsState = {
      ...formsData,
      [targetTab]: cur
    };
    try {
      const res = await fetch("/api/erp/form-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: userCenterId || "C001",
          activeFormId: targetActiveId,
          formId: targetTab,
          badgeText: cur.badgeText,
          heading: cur.heading,
          subtext: cur.subtext,
          imageUrl: cur.imageUrl,
          btnText: cur.btnText,
          btnBgColor: cur.btnBgColor,
          btnTextColor: cur.btnTextColor,
          redirectUrl: cur.redirectUrl,
          timingTitle: cur.timingTitle,
          timingDisplayMode: cur.timingDisplayMode,
          infoBoxText: cur.infoBoxText,
          timings: cur.timings,
          autoSelectTiming: cur.autoSelectTiming,
          footerText: cur.footerText,
          campaignName: cur.campaignName,
          spreadsheetId: spreadsheetId,
          forms: updatedFormsState
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus("Form customization saved successfully!");
        if (data.centerConfig && data.centerConfig.forms) {
          setFormsData(prev => ({
            "1": { ...prev["1"], ...(data.centerConfig.forms["1"] || {}) },
            "2": { ...prev["2"], ...(data.centerConfig.forms["2"] || {}) }
          }));
          if (data.centerConfig.activeFormId) {
            setActiveFormId(data.centerConfig.activeFormId);
          }
        }
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus(`Failed to save: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("Connection error saving form config.");
    }
  };

  const handleAddTiming = () => {
    if (!newTimingInput.trim()) return;
    const cur = currentEditingForm.timings || [];
    if (cur.includes(newTimingInput.trim())) return;
    updateFormData("timings", [...cur, newTimingInput.trim()]);
    setNewTimingInput("");
  };

  const handleRemoveTiming = (indexToRemove: number) => {
    const cur = currentEditingForm.timings || [];
    updateFormData("timings", cur.filter((_, idx) => idx !== indexToRemove));
  };

  // Call simulation states
  const [activeCallingLead, setActiveCallingLead] = useState<CRMLead | null>(null);
  const [callNote, setCallNote] = useState("");
  const [isSavingCall, setIsSavingCall] = useState(false);
  const [callConnected, setCallConnected] = useState(true);

  // Scheduling states
  const [schedulingLead, setSchedulingLead] = useState<CRMLead | null>(null);
  const [followupDate, setFollowupDate] = useState("");
  const [followupTime, setFollowupTime] = useState("");
  const [demoRescheduleDate, setDemoRescheduleDate] = useState("");
  const [demoRescheduleTime, setDemoRescheduleTime] = useState("");
  const [schedRemarks, setSchedRemarks] = useState("");
  const [schedAssignedTeacherId, setSchedAssignedTeacherId] = useState("");
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const handleSaveCallNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCallingLead) return;
    setIsSavingCall(true);

    const timestamp = new Date().toLocaleString();
    const fullNote = `${callConnected ? "Connected Call" : "Unconnected/Missed Call"} - Note: ${callNote || "No discussion notes logged"}`;

    try {
      const res = await fetch("/api/erp/add-lead-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: activeCallingLead.id,
          staffName: currentUser?.name || "CRM Representative",
          note: fullNote,
          timestamp: new Date().toISOString(),
          connected: callConnected
        })
      });
      const data = await res.json();
      if (data.success) {
        setLocalLeads(prev =>
          prev.map(l => l.id === activeCallingLead.id ? data.lead : l)
        );
        setActiveCallingLead(null);
        setCallNote("");
        setCallConnected(true);
        logCrmActivity("Logged CRM Call", `Recorded a call for lead ${activeCallingLead.name}. Status: ${callConnected ? "Connected" : "Not connected"}`);
      } else {
        alert("Failed to save call note: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving call note. Please try again.");
    } finally {
      setIsSavingCall(false);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingLead) return;
    setIsSavingSchedule(true);

    try {
      const isReschedulingDemo = schedulingLead.demoRescheduleDate && demoRescheduleDate && (schedulingLead.demoRescheduleDate !== demoRescheduleDate);
      const isSchedulingDemo = !schedulingLead.demoRescheduleDate && demoRescheduleDate;
      
      if (isReschedulingDemo) {
        // Automatically save a call log for the reschedule history
        await fetch("/api/erp/add-lead-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: schedulingLead.id,
            staffName: currentUser?.name || "CRM Rep",
            note: `Demo Rescheduled - Original Date: ${schedulingLead.demoRescheduleDate} (${schedulingLead.demoRescheduleTime || "N/A"}), New Date: ${demoRescheduleDate} (${demoRescheduleTime || "N/A"}). Reason: ${schedRemarks || "No reason logged"}`,
            timestamp: new Date().toISOString()
          })
        });
      }

      const matchedTeacherObj = localTeachers.find(t => t.id === schedAssignedTeacherId);

      const payload = {
        leadId: schedulingLead.id,
        followupDate: followupDate || "",
        followupTime: followupTime || "",
        demoRescheduleDate: demoRescheduleDate || "",
        demoRescheduleTime: demoRescheduleTime || "",
        remarks: schedRemarks ? `${schedulingLead.remarks ? schedulingLead.remarks + "\n" : ""}[Schedule Update ${new Date().toLocaleDateString()}]: ${schedRemarks}` : undefined,
        assignedTeacherId: schedAssignedTeacherId,
        assignedTeacherName: matchedTeacherObj?.name || ""
      };

      const res = await fetch("/api/erp/update-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        // Re-fetch or update state
        setLocalLeads(prev =>
          prev.map(l => l.id === schedulingLead.id ? data.lead : l)
        );

        if (isReschedulingDemo) {
          logCrmActivity("Demo Rescheduling", `Rescheduled demo of lead: ${schedulingLead.name} (Original: ${schedulingLead.demoRescheduleDate}, New: ${demoRescheduleDate}). Reason: ${schedRemarks || "No reason logged"}`);
        } else if (isSchedulingDemo) {
          logCrmActivity("Demo Scheduling", `Scheduled demo of lead: ${schedulingLead.name} for ${demoRescheduleDate}`);
        } else {
          logCrmActivity("Lead Status Changes", `Updated followup details of lead: ${schedulingLead.name} for ${followupDate || "N/A"}`);
        }

        setSchedulingLead(null);
        setFollowupDate("");
        setFollowupTime("");
        setDemoRescheduleDate("");
        setDemoRescheduleTime("");
        setSchedRemarks("");
      } else {
        alert("Failed to update schedule: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating schedule. Please try again.");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const openScheduling = (lead: CRMLead) => {
    setSchedulingLead(lead);
    setFollowupDate(lead.followupDate || "");
    setFollowupTime(lead.followupTime || "");
    setDemoRescheduleDate(lead.demoRescheduleDate || "");
    setDemoRescheduleTime(lead.demoRescheduleTime || "");
    setSchedRemarks("");
    setSchedAssignedTeacherId(lead.assignedTeacherId || "");
  };

  // Handle Google Sheet sync
  const handleSyncSpreadsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spreadsheetId) {
      setSyncFeedback("Please specify a Google Spreadsheet ID.");
      return;
    }

    setIsSyncing(true);
    setSyncFeedback("Fetching rows and saving configuration on server...");
    if (userCenterId) {
      localStorage.setItem(`crm_google_spreadsheet_id_${userCenterId}`, spreadsheetId);
    } else {
      localStorage.setItem("crm_google_spreadsheet_id", spreadsheetId);
    }

    try {
      // 1. Save on server so background auto-sync works too
      await fetch("/api/erp/form-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: userCenterId || "C001",
          spreadsheetId: spreadsheetId,
          forms: formsData
        })
      });

      // 2. Fetch/sync leads
      const res = await fetch("/api/erp/sync-google-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId, centerId: userCenterId || "C001" })
      });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback(`Sync complete! Loaded ${data.syncCount} new leads. Auto-Sync is now active in the background!`);
        if (data.addedLeads && data.addedLeads.length > 0) {
          setLocalLeads(prev => [...data.addedLeads, ...prev]);
        }
      } else {
        setSyncFeedback(`Failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setSyncFeedback("Connection error trying to sync spreadsheet.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Status handler with real backend sync
  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    const lead = localLeads.find(l => l.id === leadId);
    // Update locally first for snappiness
    setLocalLeads(prev =>
      prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l)
    );

    try {
      const res = await fetch("/api/erp/update-lead-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        logCrmActivity("Lead Status Changes", `Changed status of lead: ${lead?.name || leadId} to "${newStatus}"`);
      } else {
        console.error("Failed to persist lead status update", data.error);
      }
    } catch (err) {
      console.error("Error updating lead status in backend", err);
    }
  };

  const getLeadConfirmWhatsAppMessage = (lead: CRMLead) => {
    const pName = lead.parentName || "Parent";
    const cName = lead.name || "Student";
    
    let slotTime = "";
    if (lead.demoRescheduleDate) {
      slotTime = `${lead.demoRescheduleDate}${lead.demoRescheduleTime ? ` at ${lead.demoRescheduleTime}` : ""}`;
    } else if (lead.remarks) {
      const match = lead.remarks.match(/(?:Preferred Demo Slot:|Preferred Demo:)\s*([^|.\n]+)/i);
      if (match && match[1]) {
        slotTime = match[1].trim();
      }
    }

    if (slotTime) {
      return `Hello ${pName}, greetings from Geniplus Abacus Academy! Thank you for scheduling a Free Abacus Demo Class for ${cName}.\n\n🗓️ Scheduled Demo Slot: ${slotTime}\n\nPlease reply 'YES' or confirm if this time works for you so we can send the class join link & details!`;
    } else {
      return `Hello ${pName}, greetings from Geniplus Abacus Academy! Thank you for registering ${cName} for our Mental Math Abacus Program. Please let us know your preferred day and time for the free demo class so we can confirm your slot!`;
    }
  };

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!window.confirm(`Are you sure you want to delete lead "${leadName}" (${leadId})? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch("/api/erp/delete-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId })
      });
      const data = await res.json();
      if (data.success) {
        setLocalLeads(prev => prev.filter(l => l.id !== leadId));
        logCrmActivity("Lead Deleted", `Deleted lead: ${leadName} (${leadId})`);
        if (editingLead && editingLead.id === leadId) {
          setEditingLead(null);
        }
      } else {
        alert(data.error || "Failed to delete lead");
      }
    } catch (err) {
      console.error("Error deleting lead:", err);
      alert("Network error: Failed to delete lead");
    }
  };

  const updateLeadScoring = async (
    leadId: string,
    fields: {
      attendedDemo?: boolean;
      openedWhatsApp?: boolean;
      askedFees?: boolean;
      missedCallsCount?: number;
      connectionsCount?: number;
    }
  ) => {
    // Update locally first for snappiness
    setLocalLeads(prev =>
      prev.map(l => l.id === leadId ? { ...l, ...fields } : l)
    );

    try {
      const res = await fetch("/api/erp/update-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, ...fields })
      });
      const data = await res.json();
      if (data.success) {
        logCrmActivity("Lead Scoring Updated", `Updated scoring metrics for lead ID ${leadId}`);
      } else {
        console.error("Failed to persist lead scoring fields:", data.error);
      }
    } catch (err) {
      console.error("Error updating lead scoring fields in backend", err);
    }
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName) return;

    const matchedTeacherObj = localTeachers.find(t => t.id === newAssignedTeacherId);

    const payload = {
      name: newLeadName,
      parentName: newParentName,
      parentMobile: newParentMobile,
      email: newEmail,
      source: newSource,
      campaign: newCampaign,
      counsellor: currentUser?.name || "Neha Verma",
      status: "New Lead",
      remarks: newRemarks,
      centerId: newLeadCenterId || (selectedBranchFilter !== "ALL" ? selectedBranchFilter : (userCenterId || "C001")),
      assignedTeacherId: newAssignedTeacherId,
      assignedTeacherName: matchedTeacherObj?.name || ""
    };

    onAddLead(payload);

    // Reset fields
    setNewLeadName("");
    setNewParentName("");
    setNewParentMobile("");
    setNewEmail("");
    setNewRemarks("");
    setNewAssignedTeacherId("");
    setShowAddLead(false);
  };

  const handleSimulatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName || !simParent || !simMobile || !simAge || !simTiming) return;

    const remarksPayload = `Child Age: ${simAge} yrs | Preferred Demo: ${simTiming}${simRemarks ? ' | Notes: ' + simRemarks : ''}`;

    const payload = {
      name: simName,
      parentName: simParent,
      parentMobile: simMobile,
      source: "Parent Public Form",
      campaign: "Organic Referral",
      counsellor: "Neha Verma",
      status: "New Lead",
      remarks: remarksPayload,
      centerId: userCenterId || "C001"
    };

    onAddLead(payload);

    const cid = userCenterId || "C001";
    const centerObj = centers.find(c => c.id === cid);
    let prefix = "GTL";
    if (centerObj?.name) {
      const words = centerObj.name.replace(/[-_()/&\\]/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(w => w.length > 0);
      if (words.length >= 2) {
        let meaningfulWords = words;
        if (words.length > 2) {
          meaningfulWords = words.filter(w => !["branch", "center", "academy", "coaching", "institute"].includes(w.toLowerCase()));
          if (meaningfulWords.length < 2) meaningfulWords = words;
        }
        prefix = `${meaningfulWords[0].charAt(0).toUpperCase()}${meaningfulWords[1].charAt(0).toUpperCase()}L`;
      } else if (words.length === 1) {
        const w = words[0].toUpperCase();
        prefix = `${w.charAt(0)}${w.length > 1 ? w.charAt(1) : "C"}L`;
      }
    }
    const centerLeadsCount = localLeads.filter(l => (l.centerId || "C001") === cid).length;
    const simLeadNumber = `${prefix}${String(centerLeadsCount + 1).padStart(3, "0")}`;

    const newL: CRMLead = {
      id: `L00${localLeads.length + 101}`,
      leadNumber: simLeadNumber,
      centerId: cid,
      name: simName,
      parentName: simParent,
      parentMobile: simMobile,
      source: "Parent Public Form",
      campaign: "Organic Referral",
      counsellor: "Neha Verma",
      status: "New Lead",
      date: new Date().toISOString().split("T")[0],
      followupDate: new Date().toISOString().split("T")[0],
      followupTime: "10:00",
      remarks: remarksPayload,
      calls: []
    };
    setLocalLeads([newL, ...localLeads]);

    setSimSubmitted(true);
    setTimeout(() => {
      setSimName("");
      setSimAge("");
      setSimParent("");
      setSimMobile("");
      setSimTiming("");
      setSimRemarks("");
      setSimSubmitted(false);
    }, 3000);
  };

  const handleCopyLink = () => {
    const shareableUrl = `${window.location.origin}/parent-enquiry-form?center=${userCenterId || "C001"}`;
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbedCode = () => {
    const embedCode = `<iframe src="${window.location.origin}/parent-enquiry-form?center=${userCenterId || "C001"}" width="100%" height="700px" style="border:none; border-radius:16px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.08);" title="Student Enquiry Form"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleCopyRawHtml = () => {
    const rawHtml = `<!-- Copy and Paste this raw HTML Form into your WordPress, Wix, or custom website -->
<div class="aos-enquiry-container" style="max-width: 480px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
  <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 18px; font-weight: 800; color: #1e1b4b; text-align: center;">Register Student Interest</h3>
  <p style="margin-top: 0; margin-bottom: 20px; font-size: 12px; color: #64748b; text-align: center;">Submit your enquiry. Our team will contact you shortly.</p>
  
  <form id="aosEnquiryForm" style="display: flex; flex-direction: column; gap: 14px;">
    <input type="hidden" name="centerId" value="${userCenterId || "C001"}">
    <input type="hidden" name="source" value="Website Lead Form">
    <input type="hidden" name="campaign" value="Direct Web Embed">
    
    <div>
      <label style="display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 5px;">Child's Full Name *</label>
      <input type="text" name="name" required style="width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #1e293b; outline: none;" placeholder="e.g. Rahul Sharma">
    </div>

    <div>
      <label style="display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 5px;">Parent's Full Name *</label>
      <input type="text" name="parentName" required style="width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #1e293b; outline: none;" placeholder="e.g. Amit Sharma">
    </div>

    <div>
      <label style="display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 5px;">Contact Mobile Number *</label>
      <input type="tel" name="parentMobile" required style="width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #1e293b; outline: none;" placeholder="10-digit mobile number">
    </div>

    <div>
      <label style="display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 5px;">Remarks / Class Preferences</label>
      <textarea name="remarks" style="width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #1e293b; outline: none; height: 60px; resize: vertical;" placeholder="e.g. Interested in Level 1 Abacus Sat batches"></textarea>
    </div>

    <button type="submit" style="width: 100%; cursor: pointer; background: #4f46e5; border: none; color: #ffffff; border-radius: 8px; padding: 12px; font-size: 14px; font-weight: 700; transition: background 0.2s; margin-top: 6px;">Submit Registration</button>
  </form>

  <div id="aosSuccessMsg" style="display: none; text-align: center; padding: 20px 10px;">
    <span style="font-size: 28px;">✓</span>
    <h4 style="margin: 8px 0; font-size: 15px; color: #0f172a; font-weight: 800;">Thank You!</h4>
    <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">Your registration is successful. Our counselor will get back to you shortly.</p>
  </div>
</div>

<script>
  document.getElementById('aosEnquiryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var form = e.target;
    var btn = form.querySelector('button');
    btn.disabled = true;
    btn.innerText = 'Submitting...';

    var payload = {
      centerId: form.elements['centerId'].value,
      source: form.elements['source'].value,
      campaign: form.elements['campaign'].value,
      name: form.elements['name'].value,
      parentName: form.elements['parentName'].value,
      parentMobile: form.elements['parentMobile'].value,
      remarks: form.elements['remarks'].value
    };

    fetch('${window.location.origin}/api/erp/add-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          form.style.display = 'none';
          document.getElementById('aosSuccessMsg').style.display = 'block';
        }
      } else {
        alert('Error: ' + (data.error || 'Failed to submit'));
        btn.disabled = false;
        btn.innerText = 'Submit Registration';
      }
    })
    .catch(err => {
      console.error(err);
      alert('Network error. Please try again.');
      btn.disabled = false;
      btn.innerText = 'Submit Registration';
    });
  });
</script>`;
    navigator.clipboard.writeText(rawHtml);
    setCopiedRawHtml(true);
    setTimeout(() => setCopiedRawHtml(false), 2000);
  };

  // Pipeline math
  const getCountByStatus = (status: string) => {
    return localLeads.filter(l => l.status === status).length;
  };

  const filteredLeads = filterStatus === "All"
    ? localLeads
    : localLeads.filter(l => l.status === filterStatus);

  return (
    <div className="space-y-8 animate-fadeIn" id="crm-view">
      
      {/* Submenu Navigation & Timezone Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
          <button
            onClick={() => setCrmTab("pipeline")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              crmTab === "pipeline"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
            id="pipeline-tab-btn"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pipeline & Leads</span>
          </button>

          <button
            onClick={() => setCrmTab("integrations")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              crmTab === "integrations"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
            id="integrations-tab-btn"
          >
            <Link className="w-3.5 h-3.5" />
            <span>Integrations & Form Embed</span>
          </button>

          <button
            onClick={() => setCrmTab("calendar")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              crmTab === "calendar"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
            id="crm-calendar-tab-btn"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>CRM Calendar</span>
          </button>

          <button
            onClick={() => setCrmTab("marketing")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              crmTab === "marketing"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
            id="marketing-tab-btn"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Marketing Copy</span>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 w-full lg:w-auto justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Timezone:</span>
          <select
            value={selectedTimezone}
            onChange={(e: any) => setSelectedTimezone(e.target.value)}
            className="bg-transparent text-xs font-black text-indigo-950 focus:outline-none cursor-pointer"
            id="crm-timezone-select"
          >
            <option value="local">My Browser Local Time</option>
            <option value="IST">India User (IST / UTC+5:30)</option>
            <option value="EST">USA User (EST / UTC-5:00)</option>
            <option value="GST">UAE User (GST / UTC+4:00)</option>
          </select>
          <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded-lg font-black shrink-0">
            {getSimulatedCurrentTime()}
          </span>
        </div>
      </div>
      {crmTab === "pipeline" ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {[
          { key: "New Lead", label: "New Leads", color: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:border-indigo-400" },
          { key: "Demo Booked", label: "Demo Booked", color: "bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400" },
          { key: "Demo Done", label: "Demo Done", color: "bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400" },
          { key: "Enrolled", label: "Enrolled", color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400" },
          { key: "Lost", label: "Lost Leads", color: "bg-rose-50 border-rose-200 text-rose-700 hover:border-rose-400" }
        ].map((stage) => {
          const isActive = filterStatus === stage.key;
          return (
            <button
              key={stage.key}
              onClick={() => setFilterStatus(isActive ? "All" : stage.key)}
              className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer ${stage.color} ${
                isActive ? "ring-2 ring-indigo-600 scale-[1.02]" : "shadow-xs opacity-90"
              }`}
            >
              <div className="text-[10px] uppercase font-black tracking-wider text-slate-500">{stage.label}</div>
              <div className="text-xl font-black font-display mt-1 flex justify-between items-center">
                <span>{getCountByStatus(stage.key)}</span>
                <span className="text-xs text-slate-400">Leads</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* TODAY'S CONNECT SCHEDULE / NOTIFICATIONS */}
      {(() => {
        const todayStr = getLocalTodayDateString();
        
        const todaySchedules = localLeads.filter(
          lead => lead.followupDate === todayStr || lead.demoRescheduleDate === todayStr
        );

        const overdueSchedules = localLeads.filter(lead => {
          if (lead.status === "Enrolled" || lead.status === "Lost") return false;
          const fDate = lead.followupDate;
          const dDate = lead.demoRescheduleDate;
          const isFollowupPast = fDate && fDate < todayStr;
          const isDemoPast = dDate && dDate < todayStr;
          return isFollowupPast || isDemoPast;
        });

        const upcomingSchedules = localLeads.filter(lead => {
          const fDate = lead.followupDate;
          const dDate = lead.demoRescheduleDate;
          const isFollowupFuture = fDate && fDate > todayStr;
          const isDemoFuture = dDate && dDate > todayStr;
          return isFollowupFuture || isDemoFuture;
        });

        const activeNotifList = notifSubTab === "today" 
          ? todaySchedules 
          : notifSubTab === "overdue" 
          ? overdueSchedules 
          : upcomingSchedules;

        return (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-4 animate-fade-in" id="todays-notifications-panel">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-200/50 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <h3 className="text-sm font-black text-amber-950 uppercase tracking-wider font-display flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>CRM Lead Notifications Panel</span>
                </h3>
              </div>

              {/* Notification Filter Sub Tabs */}
              <div className="flex items-center gap-1 bg-amber-100 border border-amber-200 rounded-xl p-1 text-[10px] font-black uppercase tracking-wide">
                <button
                  onClick={() => setNotifSubTab("today")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    notifSubTab === "today" ? "bg-white text-amber-950 shadow-2xs" : "text-amber-800 hover:text-amber-950"
                  }`}
                  id="today-notif-tab"
                >
                  Today ({todaySchedules.length})
                </button>
                <button
                  onClick={() => setNotifSubTab("overdue")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    notifSubTab === "overdue" ? "bg-white text-amber-950 shadow-2xs" : "text-amber-800 hover:text-amber-950"
                  }`}
                  id="overdue-notif-tab"
                >
                  Overdue ({overdueSchedules.length})
                </button>
                <button
                  onClick={() => setNotifSubTab("upcoming")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    notifSubTab === "upcoming" ? "bg-white text-amber-950 shadow-2xs" : "text-amber-800 hover:text-amber-950"
                  }`}
                  id="upcoming-notif-tab"
                >
                  Upcoming ({upcomingSchedules.length})
                </button>
              </div>
            </div>
            
            <p className="text-xs text-amber-900 leading-relaxed font-semibold">
              Showing <strong className="font-extrabold uppercase">{notifSubTab}</strong> schedules. Times are customized in preview for <strong>{selectedTimezone === "local" ? "Browser Local Time" : selectedTimezone + " Time"}</strong>.
            </p>

            {activeNotifList.length === 0 ? (
              <div className="text-center py-6 bg-white/40 border border-amber-100 rounded-2xl text-amber-850 italic text-[11px] font-semibold">
                No scheduled {notifSubTab} follow-up or demo events found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {activeNotifList.map(lead => {
                  const isFollowup = lead.followupDate;
                  const isDemo = lead.demoRescheduleDate;

                  return (
                    <div key={`notif-${lead.id}`} className="bg-white border border-amber-200/60 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-xs text-indigo-950 font-display">{lead.name}</span>
                          {isFollowup && (
                            <span className="text-[10px] font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-lg uppercase tracking-wider inline-flex items-center gap-1" title={`Follow up set: ${lead.followupDate}`}>
                              Follow-Up {lead.followupTime && `at ${getSimulatedTimeString(lead.followupTime)}`}
                            </span>
                          )}
                          {isDemo && (
                            <span className="text-[10px] font-extrabold bg-pink-50 border border-pink-200 text-pink-700 px-2 py-0.5 rounded-lg uppercase tracking-wider inline-flex items-center gap-1" title={`Demo set: ${lead.demoRescheduleDate}`}>
                              Demo {lead.demoRescheduleTime && `at ${getSimulatedTimeString(lead.demoRescheduleTime)}`}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 font-bold">
                          Parent: {lead.parentName} ({lead.parentMobile})
                        </div>
                        {lead.remarks && (
                          <p className="text-[10px] text-slate-500 italic truncate max-w-xs" title={lead.remarks}>
                            "{(lead.remarks || "").split('\n').pop()}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-100/80 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => openScheduling(lead)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-[10px] px-2.5 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-3xs"
                          title="Reschedule / Modify"
                          id={`resched-notif-${lead.id}`}
                        >
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Reschedule</span>
                        </button>

                        <button
                          onClick={() => setActiveCallingLead(lead)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all active:scale-95 uppercase tracking-wider cursor-pointer"
                          title="Start Outgoing CRM Call"
                          id={`call-notif-${lead.id}`}
                        >
                          <Phone className="w-3.5 h-3.5 animate-bounce" />
                          <span>Call</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-indigo-950 font-display flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-indigo-600" />
                Active Sales & Admissions Leads
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage enquiries, move students down the funnel, and track conversion.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Branch Selector for Lead Isolation */}
              {crmBranchList.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                  <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Branch:</span>
                  <select
                    value={selectedBranchFilter}
                    onChange={(e) => {
                      setSelectedBranchFilter(e.target.value);
                      if (e.target.value !== "ALL") {
                        setNewLeadCenterId(e.target.value);
                      }
                    }}
                    className="bg-transparent font-extrabold text-indigo-950 outline-none cursor-pointer text-xs"
                  >
                    {crmBranchList.map(b => {
                      const count = validLeads.filter(l => l.centerId === b.id).length;
                      return (
                        <option key={b.id} value={b.id}>
                          {b.name} ({count} lead{count === 1 ? '' : 's'})
                        </option>
                      );
                    })}
                    {crmBranchList.length > 1 && (
                      <option value="ALL">-- All Branches ({validLeads.length}) --</option>
                    )}
                  </select>
                </div>
              )}

              {filterStatus !== "All" && (
                <button
                  onClick={() => setFilterStatus("All")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all"
                >
                  Clear Filter
                </button>
              )}
              <button
                onClick={() => setShowAddLead(!showAddLead)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs"
                id="add-lead-btn"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>

          {showAddLead && (
            <form onSubmit={handleCreateLead} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="text-xs font-black text-indigo-950 uppercase tracking-wider">Manual Enquiry Registration</div>

              {/* Dynamic Guidance Banner for Duplicate Lead Phone/Email */}
              {(() => {
                const cleanPh = (p?: string) => (p || "").replace(/[^0-9]/g, "");
                const mob = cleanPh(newParentMobile);
                const em = (newEmail || "").trim().toLowerCase();
                if (!mob && !em) return null;
                const matchingExisting = safeLeads.filter(l => {
                  const lMob = cleanPh(l.parentMobile);
                  const lEm = (l.email || "").trim().toLowerCase();
                  return (mob && lMob && mob === lMob) || (em && lEm && em === lEm);
                });

                if (matchingExisting.length === 0) return null;
                const matchedExisting = matchingExisting[0];

                return (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-950 font-medium animate-fade-in shadow-xs">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-black text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-2 flex-wrap">
                        <span>⚠️ Phone / Email Already Registered ({matchingExisting.length} Registration{matchingExisting.length > 1 ? 's' : ''})</span>
                        <span className="bg-amber-200 text-amber-900 text-[9px] px-2 py-0.5 rounded-full font-extrabold">{matchedExisting.status}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed font-semibold text-amber-900">
                        Previous registration found for <strong className="font-black text-slate-900">{matchedExisting.name}</strong> (Parent: <strong>{matchedExisting.parentName}</strong> • Mobile: <strong className="font-mono text-indigo-700">{matchedExisting.parentMobile}</strong>).
                      </p>
                      <div className="text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-lg w-fit border border-amber-200">
                        💡 Submitting this form will create a <strong>NEW distinct lead record (Registration #{matchingExisting.length + 1})</strong> for this student/sibling without overwriting existing leads.
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Branch Selection for Lead Assignment */}
              {crmBranchList.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Branch / Sub-Branch *</label>
                  <select
                    value={newLeadCenterId || (selectedBranchFilter !== "ALL" ? selectedBranchFilter : (userCenterId || "C001"))}
                    onChange={(e) => setNewLeadCenterId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-950 focus:border-indigo-500 focus:outline-none"
                  >
                    {crmBranchList.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.id}) {b.parentCenterId ? '• Sub-Branch' : '• Main Branch'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Aarav Sharma"
                    id="lead-name-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Parent Name</label>
                  <input
                    type="text"
                    required
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Mukesh Sharma"
                    id="parent-name-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Parent Mobile</label>
                  <input
                    type="text"
                    required
                    value={newParentMobile}
                    onChange={(e) => setNewParentMobile(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                    id="parent-mobile-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                    id="parent-email-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                    id="source-select"
                  >
                    <option value="Facebook Ad">Facebook Ad</option>
                    <option value="Instagram Post">Instagram Post</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk-In">Walk-In</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Campaign</label>
                  <input
                    type="text"
                    value={newCampaign}
                    onChange={(e) => setNewCampaign(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Summer Camp Promo"
                    id="campaign-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-950 mb-1 flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Assign Demo Instructor</span>
                  </label>
                  <select
                    value={newAssignedTeacherId}
                    onChange={(e) => setNewAssignedTeacherId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                    id="assigned-teacher-select"
                  >
                    <option value="">-- Unassigned (Center Pool) --</option>
                    {localTeachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.role || "Teacher"})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Enquiry Remarks / Class Requirements</label>
                <textarea
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none h-16 resize-none"
                  placeholder="e.g. Looking for Level 1 finger math coaching, interested in Sunday weekend batch"
                  id="remarks-textarea"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddLead(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
                  id="cancel-lead-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  id="submit-lead-btn"
                >
                  Register Lead
                </button>
              </div>
            </form>
          )}

          {/* View Mode Switcher & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setLeadDisplayMode("compact")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  leadDisplayMode === "compact"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Normal Compact View with Front Essential Fields"
                id="view-mode-normal-btn"
              >
                <List className="w-3.5 h-3.5" />
                <span>Normal View</span>
              </button>
              <button
                type="button"
                onClick={() => setLeadDisplayMode("kanban")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  leadDisplayMode === "kanban"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Kanban Board View"
                id="view-mode-kanban-btn"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban Mode</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, parent or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  id="crm-search-input"
                />
              </div>
              <select
                value={filterTeacherId}
                onChange={(e) => setFilterTeacherId(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 shrink-0"
                id="crm-teacher-filter-select"
              >
                <option value="All">All Teachers</option>
                <option value="unassigned">Unassigned</option>
                {localTeachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>           {/* Leads Listing Upgraded */}
           {(() => {
             const searchedLeads = filteredLeads.filter(l => {
               if (filterTeacherId !== "All") {
                 if (filterTeacherId === "unassigned") {
                   if (l.assignedTeacherId) return false;
                 } else {
                   const matchedT = localTeachers.find(t => t.id === filterTeacherId);
                   if (l.assignedTeacherId !== filterTeacherId && l.assignedTeacherName !== matchedT?.name) return false;
                 }
               }

               if (!searchQuery) return true;
               const q = searchQuery.toLowerCase();
               return (
                 l.name.toLowerCase().includes(q) ||
                 (l.parentName && l.parentName.toLowerCase().includes(q)) ||
                 (l.parentMobile && l.parentMobile.includes(q)) ||
                 (l.email && l.email.toLowerCase().includes(q)) ||
                 (l.source && l.source.toLowerCase().includes(q)) ||
                 (l.campaign && l.campaign.toLowerCase().includes(q)) ||
                 (l.remarks && l.remarks.toLowerCase().includes(q)) ||
                 (l.assignedTeacherName && l.assignedTeacherName.toLowerCase().includes(q)) ||
                 (l.leadNumber && l.leadNumber.toLowerCase().includes(q)) ||
                 l.id.toLowerCase().includes(q)
               );
             });

             const isCallingThisLead = (leadId: string) => activeCallingLead?.id === leadId;
             const isSchedulingThisLead = (leadId: string) => schedulingLead?.id === leadId;

             if (searchedLeads.length === 0) {
               return (
                 <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl space-y-2">
                   <PhoneCall className="w-8 h-8 text-slate-300 mx-auto" />
                   <h4 className="text-sm font-black text-indigo-950 font-display">No leads found</h4>
                   <p className="text-xs text-slate-500">No leads match your search query or selected stage filter.</p>
                 </div>
               );
             }

             if (leadDisplayMode === "kanban") {
               const stages = ["New Lead", "Demo Booked", "Demo Done", "Enrolled", "Lost"];
               return (
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 overflow-x-auto pb-2">
                   {stages.map(stage => {
                     const stageLeads = searchedLeads.filter(l => l.status === stage);
                     return (
                       <div key={stage} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3 flex flex-col min-w-[220px]">
                         <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-200">
                           <span className="text-xs font-black text-slate-800 font-display">{stage}</span>
                           <span className="text-[10px] font-black bg-white border border-slate-200 px-2 py-0.5 rounded-full text-indigo-700 shadow-3xs">
                             {stageLeads.length}
                           </span>
                         </div>

                         <div className="space-y-2.5 flex-1 max-h-[480px] overflow-y-auto pr-0.5">
                           {stageLeads.length === 0 ? (
                             <div className="text-[10px] text-slate-400 italic text-center py-6 border border-dashed border-slate-200 rounded-xl">
                               Empty Stage
                             </div>
                           ) : (
                             stageLeads.map(lead => (
                               <div key={lead.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all space-y-2">
                                 <div className="flex justify-between items-start gap-1">
                                   <div>
                                     <span className="text-[9px] font-mono text-indigo-600 font-black block">{lead.leadNumber || lead.id}</span>
                                     <span className="font-black text-xs text-slate-900 block truncate max-w-[130px]">{lead.name}</span>
                                   </div>
                                   <div className="flex items-center gap-1">
                                     <button
                                       type="button"
                                       onClick={() => openEditLeadModal(lead)}
                                       className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                                       title="Edit Lead"
                                     >
                                       <Pencil className="w-3 h-3" />
                                     </button>
                                     <button
                                       type="button"
                                       onClick={() => handleDeleteLead(lead.id, lead.name)}
                                       className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                       title="Delete Lead"
                                       id={`kanban-delete-lead-${lead.id}`}
                                     >
                                       <Trash2 className="w-3 h-3" />
                                     </button>
                                     <select
                                       value={lead.status}
                                       onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                       className="text-[9px] font-extrabold bg-slate-100 border border-slate-200 rounded-md p-0.5 focus:outline-none cursor-pointer"
                                     >
                                       {stages.map(s => <option key={s} value={s}>{s}</option>)}
                                     </select>
                                   </div>
                                 </div>

                                 <div className="text-[10px] text-slate-600 font-bold space-y-0.5">
                                   <div>Parent: <span className="font-extrabold text-slate-800">{lead.parentName}</span></div>
                                   <div>Ph: <span className="font-mono text-indigo-700 font-extrabold">{lead.parentMobile}</span></div>
                                   {lead.email && <div className="truncate text-[9px] text-slate-500">✉️ {lead.email}</div>}
                                   {(() => {
                                     const cleanPh = (p?: string) => (p || "").replace(/[^0-9]/g, "");
                                     const lMob = cleanPh(lead.parentMobile);
                                     const parentLeads = lMob ? safeLeads.filter(l => cleanPh(l.parentMobile) === lMob) : [];
                                     const regCount = Math.max(parentLeads.length, lead.registrationCount || 1);
                                     if (regCount <= 1) return null;
                                     return (
                                       <div className="bg-amber-100 border border-amber-300 text-amber-900 text-[8.5px] font-black px-1.5 py-0.5 rounded-md flex items-center justify-between mt-1" title={`Parent registered ${regCount} times (${parentLeads.map(l => l.name).join(', ')})`}>
                                         <span>📱 Registered {regCount}x</span>
                                       </div>
                                     );
                                   })()}
                                 </div>

                                 <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 justify-between">
                                   <a
                                     href={`https://wa.me/${lead.parentMobile.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(getLeadConfirmWhatsAppMessage(lead))}`}
                                     target="_blank"
                                     rel="noreferrer"
                                     className="bg-[#25D366] text-white p-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center flex-1"
                                     title="WhatsApp Quick Confirm"
                                   >
                                     <MessageCircle className="w-3.5 h-3.5" />
                                   </a>
                                   <button
                                     onClick={() => {
                                       setActiveCallingLead(lead);
                                       setCallNote("");
                                       setCallConnected(true);
                                       window.location.href = `tel:${lead.parentMobile}`;
                                     }}
                                     className="bg-indigo-600 text-white p-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center flex-1 cursor-pointer"
                                     title="Call"
                                   >
                                     <Phone className="w-3.5 h-3.5" />
                                   </button>
                                   <button
                                     onClick={() => openScheduling(lead)}
                                     className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center flex-1 cursor-pointer"
                                     title="Schedule"
                                   >
                                     <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                   </button>
                                 </div>
                               </div>
                             ))
                           )}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               );
             }

             return (
               <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
                 {searchedLeads.map(lead => {
                   const isExpanded = !!expandedLeadIds[lead.id];
                   const localToday = getLocalTodayDateString();
                   const isScheduledToday = lead.followupDate === localToday || lead.demoRescheduleDate === localToday;

                   return (
                     <div
                       key={lead.id}
                       id={`lead-card-${lead.id}`}
                       className={`border rounded-3xl p-4.5 space-y-3.5 transition-all duration-200 relative ${
                         isScheduledToday
                           ? "border-amber-300 ring-1 ring-amber-200 bg-amber-50/15"
                           : "border-slate-200 bg-white hover:border-slate-300"
                       }`}
                     >
                       {/* Header Row: Lead Identity, Badges & Status */}
                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                         <div className="space-y-1 flex-1 min-w-0">
                           <div className="flex flex-wrap items-center gap-2">
                             <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded-lg font-black">
                               {lead.leadNumber || lead.id}
                             </span>
                             <span className="font-black text-indigo-950 text-sm font-display tracking-tight truncate max-w-[160px]">
                               {lead.name}
                             </span>
                             <span className="text-[9px] font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-700">
                               {lead.source}
                             </span>
                             {lead.entries && lead.entries.length > 1 && (
                               <span className="text-[9px] font-black bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
                                 {lead.entries.length} Inquiries
                               </span>
                             )}
                             {(() => {
                               const cleanPh = (p?: string) => (p || "").replace(/[^0-9]/g, "");
                               const lMob = cleanPh(lead.parentMobile);
                               const parentLeads = lMob ? safeLeads.filter(l => cleanPh(l.parentMobile) === lMob) : [];
                               const regCount = Math.max(parentLeads.length, lead.registrationCount || 1);
                               if (regCount <= 1) return null;
                               return (
                                 <span className="text-[9px] font-black bg-amber-100 border border-amber-300 text-amber-900 px-2 py-0.5 rounded-full flex items-center gap-1" title={`Parent registered ${regCount} times for: ${parentLeads.map(l => l.name).join(", ")}`}>
                                   📱 Registered {regCount}x
                                 </span>
                               );
                             })()}
                             {isScheduledToday && (
                               <span className="text-[9px] font-black bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                 <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                 <span>Action Today</span>
                               </span>
                             )}
                           </div>

                           <div className="text-[11px] text-slate-700 font-bold flex flex-wrap items-center gap-2 mt-1">
                             <span>Parent: <strong className="text-slate-900 font-black">{lead.parentName}</strong></span>
                             <span>•</span>
                             <span>Ph: <strong className="text-indigo-700 font-mono font-black">{lead.parentMobile}</strong></span>
                               {lead.assignedTeacherName && (
                                 <span className="text-indigo-800 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                                   <UserPlus className="w-3 h-3 text-indigo-600" /> Demo Teacher: {lead.assignedTeacherName}
                                 </span>
                               )}
                             {lead.email && (
                               <>
                                 <span>•</span>
                                 <span className="text-slate-600 font-medium">✉️ {lead.email}</span>
                               </>
                             )}
                           </div>
                         </div>

                         {/* Action Row: WA Confirm & Pipeline Select */}
                         <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto justify-end shrink-0">
                           <a
                             href={`https://wa.me/${lead.parentMobile.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(getLeadConfirmWhatsAppMessage(lead))}`}
                             target="_blank"
                             rel="noreferrer"
                             className="bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-[11px] px-3.5 py-1.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 uppercase tracking-wider border border-[#25D366]/20 cursor-pointer"
                             title="WhatsApp Quick Confirm"
                             id={`wa-confirm-${lead.id}`}
                           >
                             <MessageCircle className="w-4 h-4 fill-white/10" />
                             <span>Confirm</span>
                           </a>

                           <select
                             value={lead.status}
                             onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                             className={`text-[11px] font-black px-2.5 py-1.5 rounded-xl border-2 focus:outline-none transition-colors cursor-pointer ${
                               lead.status === "Enrolled"
                                 ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                 : lead.status === "Lost"
                                 ? "bg-rose-50 text-rose-800 border-rose-200"
                                 : lead.status === "Demo Booked"
                                 ? "bg-blue-50 text-blue-800 border-blue-200"
                                 : lead.status === "Demo Done"
                                 ? "bg-amber-50 text-amber-800 border-amber-200"
                                 : "bg-indigo-50 text-indigo-800 border-indigo-200"
                             }`}
                             id={`status-dropdown-${lead.id}`}
                           >
                             <option value="New Lead">New Lead</option>
                             <option value="Demo Booked">Demo Booked</option>
                             <option value="Demo Done">Demo Done</option>
                             <option value="Enrolled">Enrolled</option>
                             <option value="Lost">Lost</option>
                           </select>
                         </div>
                       </div>

                       {/* Action Controls Toolbar */}
                       <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                         <div className="flex items-center gap-2">
                           <button
                             type="button"
                             onClick={() => openEditLeadModal(lead)}
                             className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
                             title="Edit Lead Details"
                             id={`crm-edit-btn-${lead.id}`}
                           >
                             <Pencil className="w-3.5 h-3.5 text-slate-700" />
                             <span>Edit Lead</span>
                           </button>

                           <button
                             type="button"
                             onClick={() => {
                               setActiveCallingLead(lead);
                               setCallNote("");
                               setCallConnected(true);
                               window.location.href = `tel:${lead.parentMobile}`;
                             }}
                             className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
                             title="Dial call via phone app"
                             id={`crm-call-btn-${lead.id}`}
                           >
                             <Phone className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                             <span>Dial Call</span>
                           </button>

                           <button
                             type="button"
                             onClick={() => openScheduling(lead)}
                             className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
                             id={`crm-schedule-btn-${lead.id}`}
                           >
                             <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                             <span>Reschedule</span>
                           </button>

                           <button
                             type="button"
                             onClick={() => handleDeleteLead(lead.id, lead.name)}
                             className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
                             title="Delete Lead"
                             id={`crm-delete-btn-${lead.id}`}
                           >
                             <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                             <span>Delete</span>
                           </button>
                         </div>

                         {/* Toggle Info Expansion Button */}
                         <button
                           type="button"
                           onClick={() => toggleLeadExpanded(lead.id)}
                           className="text-indigo-700 hover:text-indigo-950 text-xs font-black flex items-center gap-1 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-3xs"
                           id={`toggle-expand-${lead.id}`}
                         >
                           {isExpanded ? (
                             <>
                               <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                               <span>Less Info</span>
                             </>
                           ) : (
                             <>
                               <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                               <span>More Info & Log</span>
                             </>
                           )}
                         </button>
                       </div>

                       {/* Expanded Detailed Information Panel */}
                       {isExpanded && (
                         <div className="space-y-3.5 pt-3 border-t border-slate-150 animate-fade-in bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80">
                           <div className="text-[10px] text-slate-500 font-semibold flex flex-wrap items-center gap-3">
                             <span className="flex items-center gap-1">
                               <Clock className="w-3 h-3 text-slate-400" />
                               Registered: <strong className="text-slate-800">{lead.date}</strong>
                             </span>
                             <span>•</span>
                             <span>Campaign: <strong className="text-slate-800">{lead.campaign}</strong></span>
                             <span>•</span>
                             <span>Counsellor: <strong className="text-indigo-800 font-bold">{lead.counsellor}</strong></span>
                           </div>

                           {(() => {
                             const cleanPh = (p?: string) => (p || "").replace(/[^0-9]/g, "");
                             const lMob = cleanPh(lead.parentMobile);
                             const matchingParentLeads = lMob ? safeLeads.filter(l => cleanPh(l.parentMobile) === lMob) : [];
                             if (matchingParentLeads.length <= 1) return null;
                             return (
                               <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs space-y-2">
                                 <div className="font-black text-amber-950 flex items-center justify-between">
                                   <span className="flex items-center gap-1.5">
                                     📱 Parent Mobile Registered {matchingParentLeads.length} Times
                                   </span>
                                   <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-black">
                                     {matchingParentLeads.length} Enquiries
                                   </span>
                                 </div>
                                 <p className="text-[11px] text-amber-900 font-semibold">
                                   Parent mobile (<strong className="font-mono">{lead.parentMobile}</strong>) has registered for {matchingParentLeads.length} distinct student enquiries (kept separate for siblings / kids):
                                 </p>
                                 <div className="flex flex-wrap gap-1.5 pt-1">
                                   {matchingParentLeads.map((l, idx) => (
                                     <span key={l.id || idx} className={`border text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${l.id === lead.id ? 'bg-amber-500 text-white border-amber-600' : 'bg-white border-amber-200 text-amber-950'}`}>
                                       {l.id === lead.id ? '👉 ' : ''}Student: {l.name} ({l.status})
                                     </span>
                                   ))}
                                 </div>
                               </div>
                             );
                           })()}

                           {/* Inquiry History Log */}
                           {lead.entries && lead.entries.length > 0 && (
                             <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                               <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                 <span className="text-[11px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                   <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                   Inquiry Entries History ({lead.entries.length})
                                 </span>
                                 <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">Multiple Entries Logged</span>
                               </div>
                               <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                 {lead.entries.map((entry, idx) => (
                                   <div key={entry.id || idx} className="bg-slate-50 border border-slate-150 p-2 rounded-lg text-[10px] space-y-0.5">
                                     <div className="flex justify-between items-center font-bold text-slate-800">
                                       <span>Entry #{idx + 1} ({entry.source || "Walk-In"})</span>
                                       <span className="font-mono text-slate-500 text-[9px]">{entry.date} {entry.time ? `• ${entry.time}` : ''}</span>
                                     </div>
                                     {entry.campaign && <div className="text-[9px] text-slate-500 font-semibold">Campaign: {entry.campaign}</div>}
                                     {entry.remarks && <div className="text-[10px] text-slate-700 font-medium italic">"{entry.remarks}"</div>}
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}

                           {lead.remarks && (
                             <div className="bg-white border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 leading-relaxed font-semibold">
                               <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Parent Requirements & Enquiry Remarks:</span>
                               {lead.remarks}
                             </div>
                           )}

                           {/* Scheduled Connections */}
                           {(lead.followupDate || lead.demoRescheduleDate) && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                               {lead.followupDate && (
                                 <div className="flex items-center gap-2 text-[11px] text-indigo-900 bg-indigo-50 border border-indigo-150 p-2.5 rounded-xl font-bold">
                                   <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                                   <div>
                                     <span className="text-indigo-500 uppercase text-[9px] block font-black">Next Follow-up Call:</span>
                                     <span className="text-indigo-950 font-black">{lead.followupDate} {lead.followupTime && `(${lead.followupTime})`}</span>
                                   </div>
                                 </div>
                               )}
                               {lead.demoRescheduleDate && (
                                 <div className="flex items-center gap-2 text-[11px] text-pink-900 bg-pink-50 border border-pink-150 p-2.5 rounded-xl font-bold">
                                   <Video className="w-4 h-4 text-pink-600 shrink-0" />
                                   <div>
                                     <span className="text-pink-500 uppercase text-[9px] block font-black">Demo Trial Re-schedule:</span>
                                     <span className="text-pink-950 font-black">{lead.demoRescheduleDate} {lead.demoRescheduleTime && `(${lead.demoRescheduleTime})`}</span>
                                   </div>
                                 </div>
                               )}
                             </div>
                           )}

                           {/* Lead Scoring Section */}
                           <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
                             <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                               <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Lead Scoring & Engagement</span>
                               {(() => {
                                 const score = (lead.attendedDemo ? 20 : 0) + 
                                               (lead.openedWhatsApp ? 10 : 0) + 
                                               (lead.askedFees ? 15 : 0) - 
                                               ((lead.missedCallsCount || 0) * 5);
                                 let badge = { label: "Cold Lead", icon: "❄️", color: "bg-sky-50 text-sky-800 border-sky-200" };
                                 if (score >= 30) badge = { label: "Hot Lead", icon: "🔥", color: "bg-red-50 text-red-800 border-red-200" };
                                 else if (score >= 10) badge = { label: "Warm Lead", icon: "🟡", color: "bg-amber-50 text-amber-800 border-amber-200" };

                                 return (
                                   <div className="flex items-center gap-2">
                                     <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${badge.color} flex items-center gap-1`}>
                                       <span>{badge.icon}</span>
                                       <span>{badge.label}</span>
                                     </span>
                                     <span className="text-xs font-mono font-black bg-slate-900 text-white px-2 py-0.5 rounded-full">
                                       {score > 0 ? `+${score}` : score} pts
                                     </span>
                                   </div>
                                 );
                               })()}
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                               <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer">
                                 <input
                                   type="checkbox"
                                   checked={!!lead.attendedDemo}
                                   onChange={(e) => updateLeadScoring(lead.id, { attendedDemo: e.target.checked })}
                                   className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                                 />
                                 <div>
                                   <span className="font-bold text-slate-800 block text-[11px]">Attended Demo</span>
                                   <span className="text-[9px] text-emerald-600 font-extrabold">+20 pts</span>
                                 </div>
                               </label>

                               <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer">
                                 <input
                                   type="checkbox"
                                   checked={!!lead.openedWhatsApp}
                                   onChange={(e) => updateLeadScoring(lead.id, { openedWhatsApp: e.target.checked })}
                                   className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                                 />
                                 <div>
                                   <span className="font-bold text-slate-800 block text-[11px]">WhatsApp Opened</span>
                                   <span className="text-[9px] text-emerald-600 font-extrabold">+10 pts</span>
                                 </div>
                               </label>

                               <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer">
                                 <input
                                   type="checkbox"
                                   checked={!!lead.askedFees}
                                   onChange={(e) => updateLeadScoring(lead.id, { askedFees: e.target.checked })}
                                   className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                                 />
                                 <div>
                                   <span className="font-bold text-slate-800 block text-[11px]">Asked Fees</span>
                                   <span className="text-[9px] text-emerald-600 font-extrabold">+15 pts</span>
                                 </div>
                               </label>
                             </div>
                           </div>

                           {/* Timeline of Discussion Logs */}
                           {lead.calls && lead.calls.length > 0 && (
                             <div className="space-y-1.5 pt-1">
                               <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                 <History className="w-3.5 h-3.5 text-slate-400" />
                                 <span>Discussion Timeline ({lead.calls.length})</span>
                               </div>
                               <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                 {[...lead.calls].reverse().map((call, idx) => (
                                   <div key={call.id || idx} className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs space-y-1">
                                     <div className="flex justify-between items-center text-[9px]">
                                       <span className="font-black text-indigo-700">📞 {call.staffName}</span>
                                       <span className="text-slate-400 font-mono font-bold">{formatToLocalTime(call.timestamp)}</span>
                                     </div>
                                     <p className="text-slate-700 text-[11px] font-semibold">{call.note}</p>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                         </div>
                       )}

                       {/* Inline Calling Logger */}
                       {isCallingThisLead(lead.id) && (
                         <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
                           <div className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                             <Phone className="w-4 h-4 text-emerald-400 animate-pulse" />
                             <span>CRM Phone Dial & Logger</span>
                           </div>
                           <textarea
                             required
                             value={callNote}
                             onChange={(e) => setCallNote(e.target.value)}
                             placeholder="Log parent response, class timing preferences, fee concerns..."
                             className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none h-20 resize-none"
                           />
                           <div className="flex justify-end gap-2">
                             <button
                               type="button"
                               onClick={() => setActiveCallingLead(null)}
                               className="bg-slate-800 text-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl"
                             >
                               Cancel
                             </button>
                             <button
                               type="button"
                               onClick={handleSaveCallNote}
                               disabled={isSavingCall}
                               className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-1.5 rounded-xl cursor-pointer"
                             >
                               {isSavingCall ? "Saving..." : "Save Note"}
                             </button>
                           </div>
                         </div>
                       )}

                       {/* Inline Rescheduling */}
                       {isSchedulingThisLead(lead.id) && (
                         <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 space-y-3 text-slate-850">
                           <div className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                             <Calendar className="w-4 h-4 text-indigo-600" />
                             <span>Set Next Follow-up / Demo Schedule</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                               <span className="text-[10px] font-black text-indigo-700 uppercase">Follow-up Call</span>
                               <div className="grid grid-cols-2 gap-1.5">
                                 <input type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} className="w-full border rounded p-1 text-xs" />
                                 <input type="time" value={followupTime} onChange={(e) => setFollowupTime(e.target.value)} className="w-full border rounded p-1 text-xs" />
                               </div>
                             </div>
                             <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                               <span className="text-[10px] font-black text-pink-700 uppercase">Demo Class</span>
                               <div className="grid grid-cols-2 gap-1.5">
                                 <input type="date" value={demoRescheduleDate} onChange={(e) => setDemoRescheduleDate(e.target.value)} className="w-full border rounded p-1 text-xs" />
                                 <input type="time" value={demoRescheduleTime} onChange={(e) => setDemoRescheduleTime(e.target.value)} className="w-full border rounded p-1 text-xs" />
                               </div>
                             </div>
                           </div>
                           <div className="flex justify-end gap-2">
                             <button type="button" onClick={() => setSchedulingLead(null)} className="bg-white border text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl">Cancel</button>
                             <button type="button" onClick={() => handleSaveSchedule({ preventDefault: () => {} } as any)} disabled={isSavingSchedule} className="bg-indigo-600 text-white font-black text-xs px-4 py-1.5 rounded-xl">Save</button>
                           </div>
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
             );
           })()}
         </div>
       </>
  ) : crmTab === "integrations" ? (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-8" id="crm-integrations-hub">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-black text-indigo-950 font-display flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            CRM Lead Integrations & Form Embed Hub
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Share public admission forms, sync Google Sheets & Forms, embed raw HTML/iframes, and customize parent trial registration forms.
          </p>
        </div>
      </div>

      {/* Google Sheet Live Integration Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-indigo-950 font-black text-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheet Realtime Webhook Integration</span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Auto-Sync Active
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Paste your Google Apps Script Web App URL below to automatically push all CRM lead updates to your Google Sheet in real time.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={googleSheetUrl}
            onChange={(e) => setGoogleSheetUrl(e.target.value)}
            className="md:col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSyncToGoogleSheet}
            disabled={isSyncingSheet || !googleSheetUrl}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isSyncingSheet ? "Syncing Sheet..." : "Sync All CRM Data"}</span>
          </button>
        </div>
      </div>

      {/* Grid of Section 1 (Share Form), Section 2 (Google Sheets ID Sync), Section 3 (Customize Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Section 1: Parents Shareable Enquiry Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Share2 className="w-5 h-5 text-indigo-600" />
              <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider font-display">
                Share Enquiry Form With Parents
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              Copy this link and share it on WhatsApp or social pages. Leads submitted by parents will automatically reflect in your active leads pipeline immediately.
            </p>

            <div className="space-y-3">
              {/* Default Ticked Form Link */}
              <div>
                <label className="block text-[9px] font-black text-indigo-950 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>🌟 Main Link (Form {activeFormId} Active ✓)</span>
                  <a
                    href={`${window.location.origin}/parent-enquiry-form?center=${userCenterId || "C001"}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline text-[9px] font-extrabold flex items-center gap-0.5"
                  >
                    <span>Test Open</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/parent-enquiry-form?center=${userCenterId || "C001"}`}
                    className="w-full bg-indigo-50/50 border border-indigo-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-indigo-950 font-bold select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/parent-enquiry-form?center=${userCenterId || "C001"}`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-all cursor-pointer inline-flex items-center"
                    title="Copy Active Link"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Form 1 Link */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-700 uppercase">
                  <span>📄 Direct Form 1 ({formsData["1"]?.campaignName || "Trial Demo"})</span>
                  <a
                    href={`${window.location.origin}/parent-enquiry-form?center=${userCenterId || "C001"}&form=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/parent-enquiry-form?center=${userCenterId || "C001"}&form=1`}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-mono text-slate-600 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/parent-enquiry-form?center=${userCenterId || "C001"}&form=1`);
                      alert("Form 1 Link Copied!");
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center"
                    title="Copy Form 1 Link"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Form 2 Link */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-700 uppercase">
                  <span>📄 Direct Form 2 ({formsData["2"]?.campaignName || "Special Camp"})</span>
                  <a
                    href={`${window.location.origin}/parent-enquiry-form?center=${userCenterId || "C001"}&form=2`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/parent-enquiry-form?center=${userCenterId || "C001"}&form=2`}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-mono text-slate-600 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/parent-enquiry-form?center=${userCenterId || "C001"}&form=2`);
                      alert("Form 2 Link Copied!");
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center"
                    title="Copy Form 2 Link"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">HTML Embed Code (Iframe) 🌐</label>
                <div className="flex gap-2">
                  <textarea
                    readOnly
                    value={`<iframe src="${window.location.origin}/parent-enquiry-form?center=${userCenterId || "C001"}" width="100%" height="700px" style="border:none; border-radius:16px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.08);" title="Student Enquiry Form"></iframe>`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[9px] font-mono text-slate-500 select-all h-12 resize-none"
                  />
                  <button
                    onClick={handleCopyEmbedCode}
                    className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-2 rounded-lg text-indigo-700 transition-all cursor-pointer inline-flex items-center self-center"
                    title="Copy HTML Embed Code"
                  >
                    {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileCode className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Website Raw HTML & CSS Code (No Iframes) 🚀</label>
                <div className="flex gap-2">
                  <textarea
                    readOnly
                    value={`<!-- Copy and Paste this raw HTML Form into your WordPress, Wix, or custom website -->
<div class="aos-enquiry-container" style="max-width: 480px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
  <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 18px; font-weight: 800; color: #1e1b4b; text-align: center;">Register Student Interest</h3>
  <p style="margin-top: 0; margin-bottom: 20px; font-size: 12px; color: #64748b; text-align: center;">Submit your enquiry. Our team will contact you shortly.</p>
  
  <form id="aosEnquiryForm" style="display: flex; flex-direction: column; gap: 14px;">
    <input type="hidden" name="centerId" value="${userCenterId || "C001"}">
    <input type="hidden" name="source" value="Website Lead Form">
    <input type="hidden" name="campaign" value="Direct Web Embed">
    
    <div>
      <label style="display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 5px;">Child's Full Name *</label>
      <input type="text" name="name" required style="width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #1e293b; outline: none;" placeholder="e.g. Rahul Sharma">
    </div>

    <div>
      <label style="display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 5px;">Parent's Full Name *</label>
      <input type="text" name="parentName" required style="width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #1e293b; outline: none;" placeholder="e.g. Amit Sharma">
    </div>

    <div>
      <label style="display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 5px;">Contact Mobile Number *</label>
      <input type="tel" name="parentMobile" required style="width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #1e293b; outline: none;" placeholder="10-digit mobile number">
    </div>

    <div>
      <label style="display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 5px;">Remarks / Class Preferences</label>
      <textarea name="remarks" style="width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #1e293b; outline: none; height: 60px; resize: vertical;" placeholder="e.g. Interested in Level 1 Abacus Sat batches"></textarea>
    </div>

    <button type="submit" style="width: 100%; cursor: pointer; background: #4f46e5; border: none; color: #ffffff; border-radius: 8px; padding: 12px; font-size: 14px; font-weight: 700; transition: background 0.2s; margin-top: 6px;">Submit Registration</button>
  </form>

  <div id="aosSuccessMsg" style="display: none; text-align: center; padding: 20px 10px;">
    <span style="font-size: 28px;">✓</span>
    <h4 style="margin: 8px 0; font-size: 15px; color: #0f172a; font-weight: 800;">Thank You!</h4>
    <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">Your registration is successful. Our counselor will get back to you shortly.</p>
  </div>
</div>

<script>
  document.getElementById('aosEnquiryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var form = e.target;
    var btn = form.querySelector('button');
    btn.disabled = true;
    btn.innerText = 'Submitting...';

    var payload = {
      centerId: form.elements['centerId'].value,
      source: form.elements['source'].value,
      campaign: form.elements['campaign'].value,
      name: form.elements['name'].value,
      parentName: form.elements['parentName'].value,
      parentMobile: form.elements['parentMobile'].value,
      remarks: form.elements['remarks'].value
    };

    fetch('${window.location.origin}/api/erp/add-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          form.style.display = 'none';
          document.getElementById('aosSuccessMsg').style.display = 'block';
        }
      } else {
        alert('Error: ' + (data.error || 'Failed to submit'));
        btn.disabled = false;
        btn.innerText = 'Submit Registration';
      }
    })
    .catch(err => {
      console.error(err);
      alert('Network error. Please try again.');
      btn.disabled = false;
      btn.innerText = 'Submit Registration';
    });
  });
</script>`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[9px] font-mono text-slate-500 select-all h-12 resize-none"
                  />
                  <button
                    onClick={handleCopyRawHtml}
                    className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-2 rounded-lg text-indigo-700 transition-all cursor-pointer inline-flex items-center self-center"
                    title="Copy Raw HTML Form Code"
                  >
                    {copiedRawHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileCode className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>            {/* Simulated Live Form Test Preview */}
            <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-150 pb-1.5">
                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wide">Test Form Simulation</span>
                <span className="text-[9px] text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded font-bold">Parent View</span>
              </div>

              {simSubmitted ? (
                <div className="text-center py-6 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 space-y-1">
                  <Check className="w-6 h-6 text-emerald-600 mx-auto" />
                  <span className="block font-black text-xs">Interest Registered!</span>
                  <p className="text-[10px]">Lead instantly populated in the active pipeline table!</p>
                </div>
              ) : (
                <form onSubmit={handleSimulatorSubmit} className="space-y-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold text-slate-500">Child's Name</label>
                      <input
                        type="text"
                        required
                        value={simName}
                        onChange={(e) => setSimName(e.target.value)}
                        placeholder="e.g. Krrish Kumar"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">Child's Age</label>
                      <input
                        type="number"
                        required
                        min="4"
                        max="18"
                        value={simAge}
                        onChange={(e) => setSimAge(e.target.value)}
                        placeholder="Age"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">Parent's Name</label>
                      <input
                        type="text"
                        required
                        value={simParent}
                        onChange={(e) => setSimParent(e.target.value)}
                        placeholder="e.g. Amit Kumar"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500">Contact (WhatsApp)</label>
                      <input
                        type="text"
                        required
                        value={simMobile}
                        onChange={(e) => setSimMobile(e.target.value)}
                        placeholder="+91..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500">Preferred Demo Timing</label>
                    <select
                      required
                      value={simTiming}
                      onChange={(e) => setSimTiming(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="">-- Select Slot --</option>
                      {formTimings.map((t, idx) => (
                        <option key={idx} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500">Previous experience (Optional)</label>
                    <input
                      type="text"
                      value={simRemarks}
                      onChange={(e) => setSimRemarks(e.target.value)}
                      placeholder="e.g. abacus beginner"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] py-1.5 rounded-lg uppercase tracking-wider transition-all inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Submit Enquiry Demo 🚀</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Section 2: Google Sheets & Google Forms Sync */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Database className="w-5 h-5 text-indigo-600" />
              <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider font-display">
                Google Sheets ID Sync
              </h4>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Just copy your Google Spreadsheet ID and click Sync. Our system will directly load the leads.
            </p>

            <form onSubmit={handleSyncSpreadsheet} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Google Spreadsheet ID</label>
                <input
                  type="text"
                  required
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="e.g. 1aBCdEfGhIjKlMnOpQrStUvWxYz..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] font-mono text-slate-650 focus:bg-white focus:outline-none"
                />
                <span className="text-[9px] text-slate-400 font-bold block mt-1">
                  You can find this ID in your Google Sheet's browser URL.
                </span>
              </div>

              {syncFeedback && (
                <div className="bg-indigo-50 border border-indigo-150 text-indigo-950 p-2.5 rounded-xl text-[10px] font-black leading-tight">
                  {syncFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={isSyncing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-black py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing leads...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>⚡ Sync Leads from Google Sheet</span>
                  </>
                )}
              </button>
            </form>

            {/* Google Sheet Column Format Guide */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3">
              <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider block">📋 Google Form / Sheet Format Guide</span>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                To link your Google Form, ensure your spreadsheet has these exact column names in the first row. The order doesn't matter as our smart engine automatically maps them!
              </p>
              <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-600">
                      <th className="p-2">Expected Header Names</th>
                      <th className="p-2">Example Values</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px] font-semibold text-slate-500 divide-y divide-slate-50">
                    <tr>
                      <td className="p-2 font-mono text-indigo-700 bg-indigo-50/50">Child's Name</td>
                      <td className="p-2">Advik Sharma</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-indigo-700 bg-indigo-50/50">Parent Name</td>
                      <td className="p-2">Rajesh Sharma</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-indigo-700 bg-indigo-50/50">Contact Number</td>
                      <td className="p-2">9876543210</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-indigo-700 bg-indigo-50/50">Child's Age</td>
                      <td className="p-2">8</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-indigo-700 bg-indigo-50/50">Preferred Demo Timing</td>
                      <td className="p-2">Saturday Morning (10:00 AM - 11:30 AM)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-xl p-2.5 text-[10px] text-indigo-900 leading-relaxed font-bold space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-950 font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <span>⚡ Hands-Free Automated Syncing:</span>
                </div>
                <p>
                  Once synced, our server will automatically scan your sheet in the background every <strong className="font-extrabold text-indigo-950">20 seconds</strong> to import new leads instantly!
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Configure Public Enquiry Form (2 Editable Forms) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Palette className="w-5 h-5 text-indigo-600" />
              <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider font-display">
                Customize Demo Booking Forms (Form 1 & Form 2)
              </h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Create and manage 2 separate booking forms for different campaigns. Choose which form is active default using the tick mark selection below.
            </p>

            {/* Active Form Tick Mark Selection */}
            <div className="bg-indigo-50/70 border border-indigo-150 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Select Active Shared Form (Tick Mark Choice)</span>
                </span>
                <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                  Current Active: Form {activeFormId}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveFormConfig(undefined, "1")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    activeFormId === "1"
                      ? "bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <div className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                      <span>Form 1</span>
                      {activeFormId === "1" && <span className="text-[9px] text-emerald-600 font-extrabold">(Default ✓)</span>}
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium truncate">{formsData["1"]?.campaignName || "Trial Demo Form 1"}</div>
                  </div>
                  {activeFormId === "1" && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">✓</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveFormConfig(undefined, "2")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    activeFormId === "2"
                      ? "bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <div className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                      <span>Form 2</span>
                      {activeFormId === "2" && <span className="text-[9px] text-emerald-600 font-extrabold">(Default ✓)</span>}
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium truncate">{formsData["2"]?.campaignName || "Special Camp Form 2"}</div>
                  </div>
                  {activeFormId === "2" && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">✓</span>
                  )}
                </button>
              </div>
            </div>

            {/* Editor Tabs for Form 1 vs Form 2 */}
            <div className="flex border-b border-slate-200 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingFormTab("1")}
                className={`px-3 py-1.5 text-[11px] font-black border-b-2 transition-all cursor-pointer ${
                  editingFormTab === "1"
                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                ✏️ Edit Form 1 {activeFormId === "1" ? "(Active ✓)" : ""}
              </button>
              <button
                type="button"
                onClick={() => setEditingFormTab("2")}
                className={`px-3 py-1.5 text-[11px] font-black border-b-2 transition-all cursor-pointer ${
                  editingFormTab === "2"
                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                ✏️ Edit Form 2 {activeFormId === "2" ? "(Active ✓)" : ""}
              </button>
            </div>

            <form onSubmit={(e) => handleSaveFormConfig(e)} className="space-y-4 pt-1">
              {/* Campaign / Profile Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Form Internal Campaign Tag</label>
                <input
                  type="text"
                  required
                  value={currentEditingForm.campaignName || ""}
                  onChange={(e) => updateFormData("campaignName", e.target.value)}
                  placeholder="e.g. Standard Trial Form or Summer Camp Workshop"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-indigo-950 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Header Badge */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Top Badge Tagline</label>
                <input
                  type="text"
                  value={currentEditingForm.badgeText || ""}
                  onChange={(e) => updateFormData("badgeText", e.target.value)}
                  placeholder="e.g. Free Abacus Trial & Demo Session"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-850 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Heading */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Form Main Title / Heading</label>
                <input
                  type="text"
                  required
                  value={currentEditingForm.heading || ""}
                  onChange={(e) => updateFormData("heading", e.target.value)}
                  placeholder="Form Heading"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-850 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Subtext */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Form Subtext Description</label>
                <textarea
                  required
                  value={currentEditingForm.subtext || ""}
                  onChange={(e) => updateFormData("subtext", e.target.value)}
                  placeholder="Form Description"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-850 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {/* Image Banner URL & Quick Presets */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>Header Image / Poster URL (Optional)</span>
                  {currentEditingForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => updateFormData("imageUrl", "")}
                      className="text-rose-500 hover:underline text-[9px] font-bold"
                    >
                      Remove Image
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  value={currentEditingForm.imageUrl || ""}
                  onChange={(e) => updateFormData("imageUrl", e.target.value)}
                  placeholder="https://images.unsplash.com/... or image link"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-700 focus:bg-white focus:outline-none"
                />
                
                {/* Image Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Presets:</span>
                  <button
                    type="button"
                    onClick={() => updateFormData("imageUrl", "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80")}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-semibold text-slate-700 cursor-pointer"
                  >
                    🏫 Classroom
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormData("imageUrl", "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80")}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-semibold text-slate-700 cursor-pointer"
                  >
                    🧮 Math Abacus
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormData("imageUrl", "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80")}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-semibold text-slate-700 cursor-pointer"
                  >
                    🏆 Genius Kid
                  </button>
                </div>
              </div>

              {/* Button CTA Text */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Submit Button Text</label>
                <input
                  type="text"
                  required
                  value={currentEditingForm.btnText || ""}
                  onChange={(e) => updateFormData("btnText", e.target.value)}
                  placeholder="e.g. REGISTER MY CHILD'S TRIAL SESSION 🚀"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-850 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Color Configuration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Btn Background Color</label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="color"
                      value={currentEditingForm.btnBgColor || "#dc2626"}
                      onChange={(e) => updateFormData("btnBgColor", e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={currentEditingForm.btnBgColor || "#dc2626"}
                      onChange={(e) => updateFormData("btnBgColor", e.target.value)}
                      placeholder="#dc2626"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-mono text-slate-700 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Btn Text Color</label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="color"
                      value={currentEditingForm.btnTextColor || "#ffffff"}
                      onChange={(e) => updateFormData("btnTextColor", e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={currentEditingForm.btnTextColor || "#ffffff"}
                      onChange={(e) => updateFormData("btnTextColor", e.target.value)}
                      placeholder="#ffffff"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-mono text-slate-700 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Timing & Class Schedule Field Customization */}
              <div className="bg-indigo-50/50 border border-indigo-150 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">
                    Class Timings & Schedule Field Configuration
                  </span>
                </div>

                {/* Editable Field Label */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Field Title / Label
                  </label>
                  <input
                    type="text"
                    value={currentEditingForm.timingTitle || "Preferred Demo Timing"}
                    onChange={(e) => updateFormData("timingTitle", e.target.value)}
                    placeholder="e.g. Preferred Demo Timing or Live Class Schedule"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Display Mode Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    Timing Field Display Mode
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateFormData("timingDisplayMode", "dropdown")}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer text-[10px] font-extrabold ${
                        (currentEditingForm.timingDisplayMode || "dropdown") === "dropdown"
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-[11px]">🔽 Dropdown Slots</div>
                      <div className="text-[8px] opacity-80 font-normal">Parents pick a slot</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateFormData("timingDisplayMode", "info_box")}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer text-[10px] font-extrabold ${
                        currentEditingForm.timingDisplayMode === "info_box"
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-[11px]">📅 Info Schedule Box</div>
                      <div className="text-[8px] opacity-80 font-normal font-sans">Show fixed class timings</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateFormData("timingDisplayMode", "hidden")}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer text-[10px] font-extrabold ${
                        currentEditingForm.timingDisplayMode === "hidden"
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-[11px]">🚫 Hide Field</div>
                      <div className="text-[8px] opacity-80 font-normal font-sans">No timing section</div>
                    </button>
                  </div>
                </div>

                {/* If Mode === 'info_box': Edit Schedule Info Box Text */}
                {currentEditingForm.timingDisplayMode === "info_box" && (
                  <div className="space-y-2 pt-1 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase flex items-center justify-between">
                      <span>Schedule Info Box Content (Multiline)</span>
                      <span className="text-[8px] text-indigo-600 font-extrabold">Displayed on Form</span>
                    </label>
                    <textarea
                      rows={4}
                      value={currentEditingForm.infoBoxText || "📅 LIVE CLASS SCHEDULE\nStarts 1st August 2026\nSaturday: 6:00 PM – 7:00 PM\nSunday: 10:00 AM – 11:00 AM\n💻 Live Online on Zoom"}
                      onChange={(e) => updateFormData("infoBoxText", e.target.value)}
                      placeholder="Type live class timing details..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-[11px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
                    />
                    {/* Quick Presets for Info Box */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Presets:</span>
                      <button
                        type="button"
                        onClick={() => updateFormData("infoBoxText", "📅 LIVE CLASS SCHEDULE\nStarts 1st August 2026\nSaturday: 6:00 PM – 7:00 PM\nSunday: 10:00 AM – 11:00 AM\n💻 Live Online on Zoom")}
                        className="bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold text-indigo-950 cursor-pointer shadow-2xs"
                      >
                        1-Month Free Challenge
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFormData("infoBoxText", "📅 WEEKEND LIVE BATCH\nSaturday & Sunday: 5:00 PM – 6:00 PM\n💻 Interactive Online on Zoom")}
                        className="bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold text-indigo-950 cursor-pointer shadow-2xs"
                      >
                        Weekend Batch
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFormData("infoBoxText", "📅 EVENING EXPRESS BATCH\nMon, Wed, Fri: 6:30 PM – 7:30 PM\n💻 Live Interactive Classroom")}
                        className="bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold text-indigo-950 cursor-pointer shadow-2xs"
                      >
                        Evening Express
                      </button>
                    </div>
                  </div>
                )}

                {/* If Mode === 'dropdown': Manage Dropdown Choices */}
                {(currentEditingForm.timingDisplayMode || "dropdown") === "dropdown" && (
                  <div className="space-y-2 pt-1 animate-fadeIn">
                    {/* Default Timing Auto-Selection Logic */}
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentEditingForm.autoSelectTiming !== false}
                          onChange={(e) => updateFormData("autoSelectTiming", e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-800 block">✓ Default Time Slot Auto-Selection</span>
                          <span className="text-[9px] text-slate-500 leading-tight block">Automatically select the first timing choice by default so parents don't need to manually select a slot.</span>
                        </div>
                      </label>
                    </div>

                    {/* Trial Timings Choice List */}
                    <div className="space-y-2 border-t border-slate-100 pt-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Manage Dropdown Slot Options</label>
                      
                      {/* List Timings */}
                      <div className="space-y-1 max-h-32 overflow-y-auto border border-slate-150 rounded-lg p-2 bg-white">
                        {(!currentEditingForm.timings || currentEditingForm.timings.length === 0) ? (
                          <span className="text-[10px] text-slate-400 font-semibold block text-center py-2">No timings defined. Please add one below.</span>
                        ) : (
                          currentEditingForm.timings.map((t, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 px-2 py-1 rounded-md shadow-2xs">
                              <span className="text-[10px] font-bold text-slate-750">{t}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTiming(idx)}
                                className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add new timing */}
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newTimingInput}
                          onChange={(e) => setNewTimingInput(e.target.value)}
                          placeholder="e.g. Saturday 11:30 AM"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-850 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddTiming}
                          className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-lg text-indigo-700 font-extrabold text-[11px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Redirect URL Option */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3 text-indigo-600" />
                  <span>Redirect URL after Submission (Optional)</span>
                </label>
                <input
                  type="text"
                  value={currentEditingForm.redirectUrl || ""}
                  onChange={(e) => updateFormData("redirectUrl", e.target.value)}
                  placeholder="e.g. https://yourwebsite.com/thank-you or https://wa.me/919876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-850 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              {/* Footer Notice Text */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Footer Confirmation Notice</label>
                <input
                  type="text"
                  value={currentEditingForm.footerText || ""}
                  onChange={(e) => updateFormData("footerText", e.target.value)}
                  placeholder="e.g. By registering, you agree to receive trial confirmation alerts on your contact number."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-850 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Live Preview Card */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <span className="text-[9px] font-black text-indigo-950 uppercase tracking-wider block text-center">
                  Live Preview: Form {editingFormTab} ({currentEditingForm.campaignName || "Untitled"})
                </span>
                
                <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="text-center space-y-1">
                    <span className="inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      {currentEditingForm.badgeText || "FREE ABACUS TRIAL & DEMO SESSION"}
                    </span>
                    
                    {currentEditingForm.imageUrl && (
                      <div className="overflow-hidden rounded-xl border border-slate-100 max-h-24 my-1">
                        <img src={currentEditingForm.imageUrl} alt="Banner" className="w-full h-24 object-cover" />
                      </div>
                    )}

                    <h5 className="text-xs font-black text-indigo-950">
                      {currentEditingForm.heading || "RESERVE YOUR CHILD'S FREE SEAT NOW!"}
                    </h5>
                    <p className="text-[10px] text-slate-500 line-clamp-2">
                      {currentEditingForm.subtext}
                    </p>
                  </div>

                  {/* Preview Timing Section */}
                  {currentEditingForm.timingDisplayMode !== "hidden" && (
                    <div className="text-left space-y-1 pt-1 border-t border-slate-100">
                      <span className="text-[9px] font-extrabold text-slate-700 block">
                        {currentEditingForm.timingTitle || "Preferred Demo Timing"}
                      </span>
                      {currentEditingForm.timingDisplayMode === "info_box" ? (
                        <div className="bg-indigo-50/80 border border-indigo-150 rounded-xl p-2.5 text-[9px] font-bold text-indigo-950 whitespace-pre-line leading-relaxed">
                          {currentEditingForm.infoBoxText || "📅 LIVE CLASS SCHEDULE\nSaturday: 6:00 PM – 7:00 PM"}
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[9px] text-slate-600 font-semibold flex justify-between items-center">
                          <span>{currentEditingForm.timings?.[0] || "-- Select Slot --"}</span>
                          <span className="text-[8px] text-slate-400">▼</span>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    style={{ backgroundColor: currentEditingForm.btnBgColor || "#dc2626", color: currentEditingForm.btnTextColor || "#ffffff" }}
                    className="w-full font-black text-[10px] py-2.5 rounded-xl uppercase tracking-wider shadow-xs"
                  >
                    {currentEditingForm.btnText || "REGISTER MY CHILD'S TRIAL SESSION 🚀"}
                  </button>
                  
                  <p className="text-[8px] text-center text-slate-400">
                    {currentEditingForm.footerText}
                  </p>
                </div>
              </div>

              {saveStatus && (
                <div className="text-center text-[10px] font-extrabold text-indigo-950 bg-indigo-50 border border-indigo-150 py-1.5 rounded-lg animate-pulse">
                  {saveStatus}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] py-2.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              >
                <span>Save All Form Customizations 💾</span>
              </button>
            </form>
          </div>

      </div>
    </div>
  ) : crmTab === "calendar" ? (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6" id="crm-calendar-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-black text-indigo-950 font-display flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            CRM Events & Connections Calendar
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Track follow-ups, booked trials, and direct student enrollments chronologically.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl p-1 shrink-0">
          {(["day", "week", "month"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setCalendarViewMode(mode)}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                calendarViewMode === mode
                  ? "bg-white text-indigo-950 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              id={`crm-calendar-mode-${mode}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Calendars body */}
      {calendarViewMode === "month" && (
        <div className="space-y-4">
          {/* Month Selector bar */}
          <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-3 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                if (activeMonth === 0) {
                  setActiveMonth(11);
                  setActiveYear(prev => prev - 1);
                } else {
                  setActiveMonth(prev => prev - 1);
                }
              }}
              className="bg-white border border-slate-200 px-3 py-1 rounded-xl hover:bg-slate-100 text-xs font-black cursor-pointer shadow-3xs"
            >
              &larr; Prev
            </button>
            <span className="font-display font-black text-indigo-950 text-sm">
              {new Date(activeYear, activeMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => {
                if (activeMonth === 11) {
                  setActiveMonth(0);
                  setActiveYear(prev => prev + 1);
                } else {
                  setActiveMonth(prev => prev + 1);
                }
              }}
              className="bg-white border border-slate-200 px-3 py-1 rounded-xl hover:bg-slate-100 text-xs font-black cursor-pointer shadow-3xs"
            >
              Next &rarr;
            </button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-1 bg-slate-100 rounded-2xl p-2 border border-slate-200 text-center font-bold text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2 text-slate-500 uppercase tracking-wider text-[10px] font-black">{day}</div>
            ))}

            {(() => {
              const firstDayIndex = new Date(activeYear, activeMonth, 1).getDay();
              const totalDays = new Date(activeYear, activeMonth + 1, 0).getDate();
              const cells: React.ReactNode[] = [];

              // Empty pads
              for (let i = 0; i < firstDayIndex; i++) {
                cells.push(<div key={`empty-${i}`} className="bg-slate-50/40 rounded-xl h-24 border border-slate-150/40 opacity-30" />);
              }

              // Day cells
              for (let day = 1; day <= totalDays; day++) {
                const currentDayStr = `${activeYear}-${String(activeMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                
                // Get events
                const list: Array<{ type: "followup" | "demo" | "enrollment"; time: string; lead: CRMLead }> = [];
                localLeads.forEach(lead => {
                  if (lead.followupDate === currentDayStr) {
                    list.push({ type: "followup", time: lead.followupTime || "10:00 AM", lead });
                  }
                  if (lead.demoRescheduleDate === currentDayStr) {
                    list.push({ type: "demo", time: lead.demoRescheduleTime || "11:30 AM", lead });
                  }
                  if (lead.status === "Enrolled" && lead.date === currentDayStr) {
                    list.push({ type: "enrollment", time: "10:00 AM", lead });
                  }
                });

                const isSelected = calendarSelectedDate === currentDayStr;

                cells.push(
                  <div
                    key={`day-${day}`}
                    onClick={() => setCalendarSelectedDate(currentDayStr)}
                    className={`bg-white rounded-xl h-24 p-1.5 border hover:border-indigo-400 transition-all flex flex-col justify-between items-stretch text-left cursor-pointer shadow-3xs ${
                      isSelected ? "border-indigo-600 ring-1 ring-indigo-500 bg-indigo-50/10" : "border-slate-200"
                    }`}
                    id={`crm-calendar-day-${day}`}
                  >
                    <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ${
                      currentDayStr === getLocalTodayDateString()
                        ? "bg-indigo-600 text-white font-extrabold"
                        : "text-slate-700"
                    }`}>
                      {day}
                    </span>

                    <div className="space-y-0.5 overflow-y-auto max-h-[50px] pr-0.5">
                      {list.map((evt, idx) => {
                        const colorClass = evt.type === "followup"
                          ? "bg-indigo-50 border border-indigo-150 text-indigo-700"
                          : evt.type === "demo"
                          ? "bg-pink-50 border border-pink-150 text-pink-700"
                          : "bg-emerald-50 border border-emerald-150 text-emerald-700";

                        return (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCalendarEvent(evt);
                            }}
                            className={`text-[8px] font-black truncate px-1 py-0.5 rounded-sm uppercase tracking-wide cursor-pointer hover:brightness-95 flex items-center gap-0.5 ${colorClass}`}
                            title={`${evt.type.toUpperCase()}: ${evt.lead.name}`}
                          >
                            {evt.type === "followup" && <Phone className="w-2 h-2" />}
                            {evt.type === "demo" && <Video className="w-2 h-2" />}
                            {evt.type === "enrollment" && <Check className="w-2 h-2" />}
                            <span className="truncate">{evt.lead.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return cells;
            })()}
          </div>
        </div>
      )}

      {calendarViewMode === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {(() => {
            const baseDate = new Date(calendarSelectedDate);
            const dayOfWeek = baseDate.getDay();
            const weekStartDate = new Date(baseDate);
            weekStartDate.setDate(baseDate.getDate() - dayOfWeek);

            const weekCells: React.ReactNode[] = [];
            for (let i = 0; i < 7; i++) {
              const dayDate = new Date(weekStartDate);
              dayDate.setDate(weekStartDate.getDate() + i);
              const dStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`;
              
              const list: Array<{ type: "followup" | "demo" | "enrollment"; time: string; lead: CRMLead }> = [];
              localLeads.forEach(lead => {
                if (lead.followupDate === dStr) {
                  list.push({ type: "followup", time: lead.followupTime || "10:00 AM", lead });
                }
                if (lead.demoRescheduleDate === dStr) {
                  list.push({ type: "demo", time: lead.demoRescheduleTime || "11:30 AM", lead });
                }
                if (lead.status === "Enrolled" && lead.date === dStr) {
                  list.push({ type: "enrollment", time: "10:00 AM", lead });
                }
              });

              const isSelected = calendarSelectedDate === dStr;

              weekCells.push(
                <div
                  key={`week-col-${i}`}
                  onClick={() => setCalendarSelectedDate(dStr)}
                  className={`bg-slate-50 border rounded-2xl p-3 space-y-3 min-h-[300px] cursor-pointer hover:bg-slate-100/50 transition-all ${
                    isSelected ? "border-indigo-600 ring-1 ring-indigo-500" : "border-slate-200"
                  }`}
                  id={`crm-calendar-week-col-${i}`}
                >
                  <div className="border-b border-slate-200 pb-2 text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest">
                      {dayDate.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className={`text-base font-black ${
                      dStr === getLocalTodayDateString() ? "text-indigo-650 font-extrabold" : "text-slate-700"
                    }`}>
                      {dayDate.getDate()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {list.length === 0 ? (
                      <span className="text-[9px] text-slate-400 italic text-center block py-8">No Events</span>
                    ) : (
                      list.map((evt, idx) => (
                        <div
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCalendarEvent(evt);
                          }}
                          className={`rounded-xl p-2 text-left space-y-1 hover:brightness-95 cursor-pointer transition-all border ${
                            evt.type === "followup"
                              ? "bg-indigo-50 border-indigo-250 text-indigo-800"
                              : evt.type === "demo"
                              ? "bg-pink-50 border-pink-250 text-pink-800"
                              : "bg-emerald-50 border-emerald-250 text-emerald-800"
                          }`}
                        >
                          <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider">
                            <span>{evt.type}</span>
                            <span>{getSimulatedTimeString(evt.time, dStr)}</span>
                          </div>
                          <div className="text-[10px] font-black leading-tight truncate">{evt.lead.name}</div>
                          <div className="text-[9px] text-slate-500 font-bold truncate">Parent: {evt.lead.parentName}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            }
            return weekCells;
          })()}
        </div>
      )}

      {calendarViewMode === "day" && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
            <span className="text-xs font-black text-indigo-950 uppercase tracking-widest font-display">
              Schedules for {new Date(calendarSelectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-800 px-2.5 py-0.5 rounded-full font-black">
              Date ID: {calendarSelectedDate}
            </span>
          </div>

          {(() => {
            const dayEvents: Array<{ type: "followup" | "demo" | "enrollment"; time: string; lead: CRMLead }> = [];
            localLeads.forEach(lead => {
              if (lead.followupDate === calendarSelectedDate) {
                dayEvents.push({ type: "followup", time: lead.followupTime || "10:00 AM", lead });
              }
              if (lead.demoRescheduleDate === calendarSelectedDate) {
                dayEvents.push({ type: "demo", time: lead.demoRescheduleTime || "11:30 AM", lead });
              }
              if (lead.status === "Enrolled" && lead.date === calendarSelectedDate) {
                dayEvents.push({ type: "enrollment", time: "10:00 AM", lead });
              }
            });

            if (dayEvents.length === 0) {
              return (
                <div className="text-center py-16 text-slate-450 space-y-2 bg-white rounded-2xl border border-slate-150">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <span className="block text-xs font-black">No CRM schedules logged for this date</span>
                  <p className="text-[10px] text-slate-400">Select another date in Month or Week mode to inspect schedules.</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {dayEvents.map((evt, idx) => (
                  <div
                    key={idx}
                    className={`bg-white border rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-xs transition-shadow ${
                      evt.type === "followup" ? "border-indigo-200" : evt.type === "demo" ? "border-pink-200" : "border-emerald-200"
                    }`}
                    id={`crm-calendar-day-event-${idx}`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                          evt.type === "followup" ? "bg-indigo-50 text-indigo-800" : evt.type === "demo" ? "bg-pink-50 text-pink-800" : "bg-emerald-50 text-emerald-800"
                        }`}>
                          {evt.type}
                        </span>
                        <span className="font-mono text-[10px] font-black bg-slate-100 border px-1.5 py-0.5 rounded-lg text-slate-700">
                          {getSimulatedTimeString(evt.time, calendarSelectedDate)}
                        </span>
                        <span className="font-black text-indigo-950 text-sm tracking-tight">{evt.lead.name}</span>
                      </div>

                      <div className="text-xs text-slate-500 font-bold grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div>Parent: <strong className="text-slate-700">{evt.lead.parentName} ({evt.lead.parentMobile})</strong></div>
                        <div>Source: <strong className="text-slate-700">{evt.lead.source}</strong></div>
                        <div>Counsellor: <strong className="text-slate-700">{evt.lead.counsellor}</strong></div>
                      </div>

                      {evt.lead && evt.lead.remarks && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          "{((evt.lead.remarks) || "").split("\n").pop()}"
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0 self-stretch md:self-auto justify-end">
                      <button
                        type="button"
                        onClick={() => openScheduling(evt.lead)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 p-2.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                      >
                        <Calendar className="w-3.5 h-3.5 text-white/90" />
                        <span>Reschedule</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCallingLead(evt.lead)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Dial CRM Call</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Quick Details Event Modal */}
      {selectedCalendarEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="calendar-event-modal">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                  selectedCalendarEvent.type === "followup" ? "bg-indigo-50 text-indigo-800" : selectedCalendarEvent.type === "demo" ? "bg-pink-50 text-pink-800" : "bg-emerald-50 text-emerald-800"
                }`}>
                  {selectedCalendarEvent.type}
                </span>
                <span className="text-xs font-black text-indigo-950">Event Details</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCalendarEvent(null)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Student Name</span>
                <span className="text-base font-black text-indigo-950 font-display">{selectedCalendarEvent.lead.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Parent Contact</span>
                  <span className="text-xs font-black text-slate-800 leading-tight">{selectedCalendarEvent.lead.parentName}</span>
                  <span className="text-[10px] font-mono text-slate-500 block">{selectedCalendarEvent.lead.parentMobile}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Scheduled Slot</span>
                  <span className="text-xs font-black text-indigo-850">{calendarSelectedDate}</span>
                  <span className="text-[10px] font-mono text-slate-500 block">
                    {getSimulatedTimeString(selectedCalendarEvent.time, calendarSelectedDate)}
                  </span>
                </div>
              </div>

              {selectedCalendarEvent.lead.remarks && (
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Lead Remarks</span>
                  <p className="text-[11px] text-slate-650 bg-slate-50 p-2.5 rounded-xl border border-slate-150 leading-relaxed font-semibold">
                    {selectedCalendarEvent.lead.remarks}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  openScheduling(selectedCalendarEvent.lead);
                  setSelectedCalendarEvent(null);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2 rounded-xl border border-emerald-600 transition-all cursor-pointer text-center shadow-xs"
              >
                Reschedule
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCallingLead(selectedCalendarEvent.lead);
                  setSelectedCalendarEvent(null);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2 rounded-xl shadow-xs transition-all cursor-pointer text-center"
              >
                Dial CRM Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-8" id="crm-marketing-hub">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-black text-indigo-950 font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Marketing, Counselling & Sales Suite (Gemini 2.5 Flash)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Full suite of 3 dedicated AI tools: generate custom marketing campaigns, resolve parent doubts, and handle sales objections instantly.
          </p>
        </div>
      </div>

      {/* Feature 4: AI Custom Marketing Copy Generator */}
      <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-indigo-100 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-indigo-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
            4
          </div>
          <div>
            <h4 className="text-sm font-black text-indigo-950 flex items-center gap-2">
              <span>AI Custom Campaign & Marketing Copy Generator</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-mono">/api/gemini/marketing</span>
            </h4>
            <p className="text-xs text-slate-500">Generate targeted WhatsApp broadcasts, Instagram posts, Google ads, and flyers.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Platform</label>
            <select
              value={marketingPlatform}
              onChange={(e) => setMarketingPlatform(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
            >
              <option value="WhatsApp Broadcast">WhatsApp Broadcast</option>
              <option value="Instagram / Facebook Post">Instagram / Facebook Post</option>
              <option value="Google Ad Copy">Google Ad Copy</option>
              <option value="Pamphlet / Flyer Hook">Pamphlet / Flyer Hook</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Goal</label>
            <input
              type="text"
              value={marketingGoal}
              onChange={(e) => setMarketingGoal(e.target.value)}
              placeholder="e.g. Free trial class bookings"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keywords / USPs</label>
            <input
              type="text"
              value={marketingKeywords}
              onChange={(e) => setMarketingKeywords(e.target.value)}
              placeholder="e.g. Speed, Memory, ISO Certified"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          onClick={handleRunMarketing}
          disabled={marketingLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
        >
          {marketingLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Generating Custom Marketing Campaign...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate AI Campaign Copy</span>
            </>
          )}
        </button>

        {marketingOutput && (
          <div className="bg-white border border-indigo-200 rounded-2xl p-4 space-y-2 text-xs text-slate-800 animate-fade-in shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-black text-indigo-950 uppercase tracking-wider text-[10px]">AI Generated Campaign Output</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(marketingOutput);
                  alert("Marketing copy copied to clipboard!");
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Output</span>
              </button>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-sans">{marketingOutput}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature 3: AI Parent Counsellor & Doubt Resolver */}
        <div className="bg-gradient-to-br from-amber-50/40 via-white to-slate-50 border border-amber-100 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                3
              </div>
              <div>
                <h4 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                  <span>AI Parent Counsellor & Doubt Resolver</span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-mono">/api/gemini/counsel</span>
                </h4>
                <p className="text-xs text-slate-500">Get pedagogical & scientific answers to resolve complex parent queries.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Parent Question / Query / Doubt</label>
              <textarea
                value={counselQuery}
                onChange={(e) => setCounselQuery(e.target.value)}
                rows={3}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-amber-500 leading-relaxed"
                placeholder="e.g. Will Abacus interfere with school math symbols?"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRunCounsel}
              disabled={counselLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            >
              {counselLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Pedagogical Guidance...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Generate Parent Counsel Script</span>
                </>
              )}
            </button>

            {counselOutput && (
              <div className="bg-white border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-slate-800 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-black text-amber-900 uppercase tracking-wider text-[10px]">Counsellor Response Script</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(counselOutput);
                      alert("Counsel response copied to clipboard!");
                    }}
                    className="text-amber-700 hover:text-amber-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Response</span>
                  </button>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">{counselOutput}</div>
              </div>
            )}
          </div>
        </div>

        {/* Feature 5: AI Sales Coach & Objection Handler */}
        <div className="bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 border border-emerald-100 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                5
              </div>
              <div>
                <h4 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                  <span>AI Sales Coach & Objection Handler</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-mono">/api/gemini/sales</span>
                </h4>
                <p className="text-xs text-slate-500">Convert stubborn leads with high-converting phone & meeting call scripts.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Call / Meeting Scenario</label>
              <input
                type="text"
                value={salesScenario}
                onChange={(e) => setSalesScenario(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 mb-3"
              />

              <label className="block text-xs font-bold text-slate-700 mb-1">Parent Sales Objection</label>
              <textarea
                value={salesObjection}
                onChange={(e) => setSalesObjection(e.target.value)}
                rows={2}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                placeholder="e.g. Fees are too expensive / need discount"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRunSales}
              disabled={salesLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            >
              {salesLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Drafting Objection Handling Script...</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-4 h-4" />
                  <span>Generate Sales Objection Script</span>
                </>
              )}
            </button>

            {salesOutput && (
              <div className="bg-white border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs text-slate-800 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-black text-emerald-900 uppercase tracking-wider text-[10px]">Sales Coach Call Script</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(salesOutput);
                      alert("Sales script copied to clipboard!");
                    }}
                    className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Script</span>
                  </button>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">{salesOutput}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Pre-Built Templates */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Quick Copy Templates</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h5 className="text-xs font-black text-indigo-950 uppercase tracking-wider">WhatsApp Broadcast Copy</h5>
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-800 space-y-1">
              <p className="font-bold text-indigo-950">🌟 Unlock Your Child's Mental Math Superpower!</p>
              <p>Dear Parent, did you know learning Abacus boosts concentration, calculation speed, and memory retention by 3x?</p>
              <p className="font-semibold text-emerald-700">👉 Book trial: {getFormShareableUrl()}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`🌟 Unlock Your Child's Mental Math Superpower!\n\nDear Parent, did you know learning Abacus boosts concentration, calculation speed, and memory retention by 3x?\n\n🎓 Join our Free Live Interactive Trial Class this weekend!\n\n👉 Book slot: ${getFormShareableUrl()}`);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Template</span>
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h5 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Social Media / Ad Headline</h5>
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-800 space-y-1">
              <p className="font-bold text-indigo-950">🚀 Say Goodbye to Math Fear Forever!</p>
              <p>ISO 9001:2015 Certified Academy. Watch your child solve 3-digit sums in seconds without a calculator!</p>
              <p className="font-bold text-indigo-700">Limited trial seats for ages 5-14.</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`🚀 Say Goodbye to Math Fear Forever!\nOur ISO 9001:2015 Certified Academy has trained 5000+ students in mental arithmetic. Watch your child solve 3-digit sums in seconds without a calculator!\n\nLimited trial seats available for ages 5-14.`);
                setCopiedEmbed(true);
                setTimeout(() => setCopiedEmbed(false), 2000);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* Global Call Logging Modal */}
      {activeCallingLead && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in" id="global-call-modal">
          <div className="bg-slate-900 border border-slate-950 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setActiveCallingLead(null);
                setCallNote("");
                setCallConnected(true);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-black p-1 bg-slate-800 hover:bg-slate-700 rounded-full"
            >
              ✕
            </button>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black tracking-wider text-slate-250 uppercase font-mono">
                  CRM Outgoing Call & Note Logger
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1.5 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
              <div>Lead Name: <strong className="text-white text-sm font-display">{activeCallingLead.name}</strong></div>
              <div>Parent Name: <strong className="text-slate-300">{activeCallingLead.parentName}</strong></div>
              <div>Mobile No: <strong className="text-emerald-300 font-mono text-xs">{activeCallingLead.parentMobile}</strong></div>
              <div className="text-[10px] text-slate-400 leading-normal mt-1 pt-1.5 border-t border-slate-800/40">
                You can trigger your system/phone dialer instantly by clicking the button below, then log parent discussion details and connection outcome.
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={`tel:${activeCallingLead.parentMobile}`}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 text-center cursor-pointer"
                id="global-dial-link"
              >
                <Phone className="w-4 h-4 text-emerald-250 animate-pulse" />
                <span>Dial Parent Now</span>
              </a>
            </div>

            {/* Connection confirmation check */}
            <div className="bg-slate-950/20 border border-slate-800 p-3.5 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={callConnected}
                  onChange={(e) => setCallConnected(e.target.checked)}
                  className="w-4 h-4 rounded mt-0.5 border-slate-750 bg-slate-850 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-black text-slate-100 block">
                    ✅ Successful Live Connection
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold leading-tight mt-0.5">
                    Check if the parent answered and you completed a conversation. This increments conversion metrics.
                  </span>
                </div>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider">Discussion Notes & Call Summary</label>
              <textarea
                required
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
                placeholder="Describe parent requirements, requested slot, fee concerns, follow-up preferences, etc..."
                className="w-full bg-slate-850 border border-slate-700 text-slate-100 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-none placeholder-slate-500 h-24 resize-none font-semibold"
                id="global-call-textarea"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/40">
              <button
                type="button"
                onClick={() => {
                  setActiveCallingLead(null);
                  setCallNote("");
                  setCallConnected(true);
                }}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl border border-slate-700 transition-all active:scale-95 uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCallNote}
                disabled={isSavingCall}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-5 py-2 rounded-xl transition-all active:scale-95 uppercase tracking-wider flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                id="global-save-call-btn"
              >
                {isSavingCall ? "Saving..." : "Log & Save Call"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Rescheduling Modal */}
      {schedulingLead && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in" id="global-schedule-modal">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-slate-850 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setSchedulingLead(null);
                setFollowupDate("");
                setFollowupTime("");
                setDemoRescheduleDate("");
                setDemoRescheduleTime("");
                setSchedRemarks("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer text-xs font-black p-1 bg-slate-100 hover:bg-slate-200 rounded-full"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 border-b border-slate-150 pb-3">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider font-display">
                  Schedule Connection Preferences
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  Update follow-up parameters and demo schedules for applicant <strong>{schedulingLead.name}</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {/* Follow up row */}
              <div className="p-3 bg-indigo-50/35 border border-indigo-100/50 rounded-xl space-y-2">
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                  📞 Next Follow-up Call
                </span>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Date</label>
                    <input
                      type="date"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Time</label>
                    <input
                      type="time"
                      value={followupTime}
                      onChange={(e) => setFollowupTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Demo slot row */}
              <div className="p-3 bg-pink-50/35 border border-pink-100/50 rounded-xl space-y-2">
                <span className="text-[10px] font-black text-pink-700 uppercase tracking-wider flex items-center gap-1">
                  🎓 Schedule Demo / Trial Class
                </span>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Demo Date</label>
                    <input
                      type="date"
                      value={demoRescheduleDate}
                      onChange={(e) => setDemoRescheduleDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Demo Time</label>
                    <input
                      type="time"
                      value={demoRescheduleTime}
                      onChange={(e) => setDemoRescheduleTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-indigo-900 mb-0.5 flex items-center gap-1">
                      <UserPlus className="w-3 h-3 text-indigo-600" />
                      <span>Select Demo Teacher</span>
                    </label>
                    <select
                      value={schedAssignedTeacherId}
                      onChange={(e) => setSchedAssignedTeacherId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="">-- Select Teacher for Demo --</option>
                      {localTeachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.role || "Teacher"})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Internal Reschedule remarks</label>
              <textarea
                value={schedRemarks}
                onChange={(e) => setSchedRemarks(e.target.value)}
                placeholder="Reason for reschedule or additional requests..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-none h-20 resize-none font-semibold"
                id="global-schedule-remarks"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSchedulingLead(null);
                  setFollowupDate("");
                  setFollowupTime("");
                  setDemoRescheduleDate("");
                  setDemoRescheduleTime("");
                  setSchedRemarks("");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2 rounded-xl transition-all active:scale-95 uppercase tracking-wider flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                id="global-save-schedule-btn"
              >
                {isSavingSchedule ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LEAD MODAL */}
      {editingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-indigo-950 uppercase tracking-wider font-display flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-indigo-600" />
                  Edit Lead Record: <span className="font-mono text-indigo-600">{editingLead.id}</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">Update student details, parent contact, status and schedule parameters.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditLead} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Student / Child Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    required
                    value={editParentName}
                    onChange={(e) => setEditParentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Parent Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={editParentMobile}
                    onChange={(e) => setEditParentMobile(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Inquiry Source</label>
                  <select
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Walk-In">Walk-In</option>
                    <option value="Facebook Ad">Facebook Ad</option>
                    <option value="Instagram Post">Instagram Post</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Referral">Referral</option>
                    <option value="Public Form">Public Form</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Campaign</label>
                  <input
                    type="text"
                    value={editCampaign}
                    onChange={(e) => setEditCampaign(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Pipeline Stage / Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-2.5 py-2 text-xs font-black text-indigo-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Demo Booked">Demo Booked</option>
                    <option value="Demo Done">Demo Done</option>
                    <option value="Enrolled">Enrolled</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-black text-indigo-900 uppercase tracking-wider mb-1">Follow-up Call Date & Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={editFollowupDate}
                      onChange={(e) => setEditFollowupDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800"
                    />
                    <input
                      type="time"
                      value={editFollowupTime}
                      onChange={(e) => setEditFollowupTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-pink-900 uppercase tracking-wider mb-1">Demo Reschedule Date & Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={editDemoDate}
                      onChange={(e) => setEditDemoDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800"
                    />
                    <input
                      type="time"
                      value={editDemoTime}
                      onChange={(e) => setEditDemoTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Counsellor / Assigned Staff</label>
                  <input
                    type="text"
                    value={editCounsellor}
                    onChange={(e) => setEditCounsellor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-indigo-950 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5 text-indigo-600" /> Assigned Demo Instructor
                  </label>
                  <select
                    value={editAssignedTeacherId}
                    onChange={(e) => setEditAssignedTeacherId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select Teacher for Demo --</option>
                    {localTeachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role || "Teacher"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Inter-Center Lead Sharing Section */}
              {((centers && centers.length > 1) || isSuperAdmin) && (
                <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-150 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-950 font-black text-xs uppercase tracking-wider">
                    <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Inter-Center Lead Sharing (Share Lead to Sub-Centers / Branches)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    Select sub-centers/branches that should also have access to view and follow up on this lead in their CRM tab:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {centers
                      .filter(c => c.id !== editingLead.centerId)
                      .map(branch => {
                        const isChecked = editSharedCenterIds.includes(branch.id);
                        return (
                          <label
                            key={branch.id}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                              isChecked
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditSharedCenterIds(prev => [...prev, branch.id]);
                                } else {
                                  setEditSharedCenterIds(prev => prev.filter(id => id !== branch.id));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="truncate">{branch.name} ({branch.id})</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">Enquiry Remarks & Parent Notes</label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none h-20 resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteLead(editingLead.id, editingLead.name)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                  id="modal-delete-lead-btn"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Lead</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLead(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                  >
                    Save Lead Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
