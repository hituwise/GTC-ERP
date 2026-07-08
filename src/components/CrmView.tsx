import React, { useState } from "react";
import { CRMLead } from "../types";
import { Sparkles, Megaphone, HelpCircle, PhoneCall, CheckCircle, ChevronRight, UserPlus, Clock, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";

interface CrmViewProps {
  leads: CRMLead[];
  onAddLead: (lead: Partial<CRMLead>) => void;
}

export default function CrmView({ leads, onAddLead }: CrmViewProps) {
  // CRM leads pipeline state
  const [localLeads, setLocalLeads] = useState<CRMLead[]>(leads);
  const [showAddLead, setShowAddLead] = useState(false);
  
  // Form fields
  const [newLeadName, setNewLeadName] = useState("");
  const [newParentName, setNewParentName] = useState("");
  const [newParentMobile, setNewParentMobile] = useState("");
  const [newSource, setNewSource] = useState("Facebook Ad");
  const [newCampaign, setNewCampaign] = useState("Direct Enquiry");
  const [newRemarks, setNewRemarks] = useState("");

  // AI features loading / output states
  const [aiMarketingOutput, setAiMarketingOutput] = useState("");
  const [aiMarketingLoading, setAiMarketingLoading] = useState(false);
  const [mPlatform, setMPlatform] = useState("Facebook Ad");
  const [mGoal, setMGoal] = useState("Increase Summer Camp Admissions");
  const [mKeywords, setMKeywords] = useState("Ages 5-13, master arithmetic, concentration boost, free assessment");

  const [aiSalesOutput, setAiSalesOutput] = useState("");
  const [aiSalesLoading, setAiSalesLoading] = useState(false);
  const [objection, setObjection] = useState("The fees are too high compared to local tuitions");
  const [scenario, setScenario] = useState("Parent is a professional, child is 8, very interested but looking for discount");

  const [aiCounsellorOutput, setAiCounsellorOutput] = useState("");
  const [aiCounsellorLoading, setAiCounsellorLoading] = useState(false);
  const [parentQuery, setParentQuery] = useState("My child is already struggling with school math. Won't learning abacus double-digit formulas confuse them?");

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName) return;

    const payload = {
      name: newLeadName,
      parentName: newParentName,
      parentMobile: newParentMobile,
      source: newSource,
      campaign: newCampaign,
      counsellor: "Neha Verma",
      status: "New Lead",
      remarks: newRemarks,
      centerId: "C001"
    };

    onAddLead(payload);

    // Update locally
    const newL: CRMLead = {
      id: `L00${localLeads.length + 1000}`,
      centerId: "C001",
      name: newLeadName,
      parentName: newParentName,
      parentMobile: newParentMobile,
      source: newSource,
      campaign: newCampaign,
      counsellor: "Neha Verma",
      status: "New Lead",
      date: new Date().toISOString().split("T")[0],
      remarks: newRemarks
    };
    setLocalLeads([newL, ...localLeads]);

    // Reset
    setNewLeadName("");
    setNewParentName("");
    setNewParentMobile("");
    setNewRemarks("");
    setShowAddLead(false);
  };

  const updateLeadStatus = (leadId: string, newStatus: string) => {
    setLocalLeads(prev =>
      prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l)
    );
  };

  // AI API Call Helpers
  const handleGenerateMarketing = async () => {
    setAiMarketingLoading(true);
    setAiMarketingOutput("");
    try {
      const res = await fetch("/api/gemini/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: mPlatform, goal: mGoal, keywords: mKeywords })
      });
      const data = await res.json();
      if (data.success) {
        setAiMarketingOutput(data.text);
      } else {
        setAiMarketingOutput("Error: " + data.error);
      }
    } catch (e: any) {
      setAiMarketingOutput("Failed to fetch response: " + e.message);
    } finally {
      setAiMarketingLoading(false);
    }
  };

  const handleGenerateSales = async () => {
    setAiSalesLoading(true);
    setAiSalesOutput("");
    try {
      const res = await fetch("/api/gemini/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objection, scenario })
      });
      const data = await res.json();
      if (data.success) {
        setAiSalesOutput(data.text);
      } else {
        setAiSalesOutput("Error: " + data.error);
      }
    } catch (e: any) {
      setAiSalesOutput("Failed to fetch coaching script: " + e.message);
    } finally {
      setAiSalesLoading(false);
    }
  };

  const handleCounselParent = async () => {
    setAiCounsellorLoading(true);
    setAiCounsellorOutput("");
    try {
      const res = await fetch("/api/gemini/counsel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: parentQuery })
      });
      const data = await res.json();
      if (data.success) {
        setAiCounsellorOutput(data.text);
      } else {
        setAiCounsellorOutput("Error: " + data.error);
      }
    } catch (e: any) {
      setAiCounsellorOutput("Failed to counsel parent: " + e.message);
    } finally {
      setAiCounsellorLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="crm-view">
      {/* Lead Generation CRM Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Pipeline & List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-indigo-600" />
                Active Sales & Admissions Leads
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage enquiries and move students down the admission funnel.</p>
            </div>
            <button
              onClick={() => setShowAddLead(!showAddLead)}
              className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-xl text-indigo-700 text-xs font-semibold transition-all active:scale-95"
              id="add-lead-btn"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          </div>

          {showAddLead && (
            <form onSubmit={handleCreateLead} className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6 space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">New Enquiry Registration</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                    id="lead-name-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Parent Name</label>
                  <input
                    type="text"
                    required
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                    id="parent-name-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Parent Mobile</label>
                  <input
                    type="text"
                    required
                    value={newParentMobile}
                    onChange={(e) => setNewParentMobile(e.target.value)}
                    placeholder="+91"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                    id="parent-mobile-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
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
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Campaign</label>
                  <input
                    type="text"
                    value={newCampaign}
                    onChange={(e) => setNewCampaign(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                    id="campaign-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Enquiry Remarks</label>
                <textarea
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500 h-16"
                  id="remarks-textarea"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLead(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
                  id="cancel-lead-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  id="submit-lead-btn"
                >
                  Register Lead
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {localLeads.map((lead) => (
              <div key={lead.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">{lead.id}</span>
                    <span className="font-bold text-gray-900 text-sm font-display">{lead.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    <div>Parent: <span className="font-semibold text-gray-700">{lead.parentName}</span> ({lead.parentMobile})</div>
                    <div className="flex gap-2 text-[10px] text-gray-400">
                      <span>Source: <strong className="text-gray-500">{lead.source}</strong></span>
                      <span>•</span>
                      <span>Campaign: <strong className="text-gray-500">{lead.campaign}</strong></span>
                    </div>
                  </div>
                  {lead.remarks && (
                    <div className="bg-white border border-gray-100 rounded p-2 text-[11px] text-gray-600 mt-2 font-medium">
                      {lead.remarks}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 w-full md:w-auto shrink-0 border-t md:border-0 pt-2 md:pt-0">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-semibold text-slate-500">{lead.date}</span>
                  </div>
                  <select
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:outline-none ${
                      lead.status === "Admission Confirmed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : lead.status === "Lost"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : lead.status === "Demo Scheduled" || lead.status === "Demo Attended"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}
                    id={`status-select-${lead.id}`}
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Demo Scheduled">Demo Scheduled</option>
                    <option value="Demo Attended">Demo Attended</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Admission Confirmed">Admission Confirmed</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Social Ads & Campaigns Assistant (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-1">
              <Megaphone className="w-5 h-5 text-indigo-600" />
              AI Marketing Copilot
            </h3>
            <p className="text-xs text-slate-500 mb-4">Generate compelling Facebook campaigns, WhatsApp broadcast copy, or social posts instantly.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Target Platform</label>
                <select
                  value={mPlatform}
                  onChange={(e) => setMPlatform(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium"
                  id="marketing-platform-select"
                >
                  <option value="Facebook Ad">Facebook Conversion Ad</option>
                  <option value="Instagram Post">Instagram Carousel & Reels Hook</option>
                  <option value="WhatsApp Broadcast">WhatsApp Parent Broadcast List</option>
                  <option value="Email Newsletter">Admission Invitation Email</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Campaign Focus / Goal</label>
                <input
                  type="text"
                  value={mGoal}
                  onChange={(e) => setMGoal(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  id="marketing-goal-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Keywords / USPs to highlight</label>
                <textarea
                  value={mKeywords}
                  onChange={(e) => setMKeywords(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium h-14"
                  id="marketing-keywords-textarea"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
            <button
              onClick={handleGenerateMarketing}
              disabled={aiMarketingLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-[0.98]"
              id="generate-marketing-btn"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiMarketingLoading ? "Writing Copy..." : "Generate High-Converting Copy"}</span>
            </button>

            {aiMarketingOutput && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-[160px] overflow-y-auto text-xs font-mono text-slate-700 leading-relaxed white-space-pre-wrap">
                {aiMarketingOutput}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales objection coach & Parent counseling panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sales objection coach */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-1">
              <MessageSquare className="w-5 h-5 text-rose-600" />
              AI Sales Objection Coach
            </h3>
            <p className="text-xs text-slate-500 mb-4">Master admission calls. Learn exactly how to respond to parent objections.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Common Parent Objection</label>
                <select
                  value={objection}
                  onChange={(e) => setObjection(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium"
                  id="sales-objection-select"
                >
                  <option value="The fees are too high compared to local tuitions">"The fees are too high"</option>
                  <option value="My child is too busy with school and extra homework">"My child has no time / too busy"</option>
                  <option value="Is Abacus relevant in the era of calculators and AI?">"Is abacus relevant in the AI/calculator era?"</option>
                  <option value="My child is only 5, maybe they are too young for math">"Child is too young (Age 5-6)"</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Scenario Description</label>
                <input
                  type="text"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  id="sales-scenario-input"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
            <button
              onClick={handleGenerateSales}
              disabled={aiSalesLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all active:scale-[0.98]"
              id="generate-sales-btn"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{aiSalesLoading ? "Analyzing Concern..." : "Get Live Sales Objection Handling Script"}</span>
            </button>

            {aiSalesOutput && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-[200px] overflow-y-auto text-xs text-slate-700 leading-relaxed font-sans">
                <div className="font-semibold text-[10px] text-slate-400 uppercase mb-1">Coaching Script & Action Steps</div>
                <div className="whitespace-pre-wrap">{aiSalesOutput}</div>
              </div>
            )}
          </div>
        </div>

        {/* AI Parent Counsellor */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-1">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              Geniplus AI Parent Counsellor
            </h3>
            <p className="text-xs text-slate-500 mb-4">Resolve parent pedagogical doubts regarding brain mechanics, visual math, or curriculum concerns.</p>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Parent Question / Worry</label>
              <textarea
                value={parentQuery}
                onChange={(e) => setParentQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium h-24 focus:ring-1 focus:ring-indigo-500"
                id="parent-query-textarea"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
            <button
              onClick={handleCounselParent}
              disabled={aiCounsellorLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-[0.98]"
              id="counsel-parent-btn"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiCounsellorLoading ? "Formulating Scientific Response..." : "Consult AI Academy Counsellor"}</span>
            </button>

            {aiCounsellorOutput && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-[160px] overflow-y-auto text-xs text-slate-700 leading-relaxed">
                <div className="font-semibold text-[10px] text-emerald-600 uppercase mb-1">Scientific Counselling Advice</div>
                <div className="whitespace-pre-wrap">{aiCounsellorOutput}</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
