import React, { useState, useEffect } from "react";
import { Teacher, Competition } from "../types";
import { 
  Trophy, Plus, Users, Share2, Award, 
  Sparkles, CheckCircle2, Copy, Calendar, 
  Flame, Loader2, Brain, Calculator, Globe, Eye, Puzzle, ArrowRight, UserCheck
} from "lucide-react";

interface CompetitionManagerProps {
  currentTeacher: Teacher;
  onRefreshData?: () => Promise<void>;
}

// Top 5 High-Converting Competition Lead Magnet Templates
const LEAD_MAGNET_PRESETS = [
  {
    id: "brain_iq",
    icon: "🧠",
    badge: "⭐ #1 FLAGSHIP LEAD MAGNET",
    title: "Geniplus Brain & IQ Challenge",
    category: "Mental Math" as const,
    description: "How Sharp Is Your Child's Brain? FREE Challenge testing Concentration, Memory, Maths, Logical Thinking & GK (Age 5–14). Gives Score, Skill Breakdown, Rank & Digital Certificate!",
    rules: "30 Questions testing 5 brain dimensions (Concentration, Memory, Maths, Logic, GK). Instant skill breakdown report generated on submission.",
    entryFee: 0,
    marketingCopy: `🧠 *How Sharp Is Your Child's Brain?*\nJoin the FREE *Geniplus Brain & IQ Challenge*\nFor Children Age 5–14\n\nTests:\n🎯 Concentration\n🧠 Memory\n➗ Maths\n🧩 Logical Thinking\n🌍 General Knowledge\n\n🏆 Get Instant Score + Skill Breakdown + Rank + Digital Certificate!`
  },
  {
    id: "maths_genius",
    icon: "➗",
    badge: "🎯 HIGH CONVERTING MATH LEAD",
    title: "National Maths Genius Challenge",
    category: "Abacus Speed" as const,
    description: "Speed calculation & mental arithmetic speed test for young math whizzes. Evaluates rapid calculation accuracy and speed without calculator.",
    rules: "Solve 25 rapid mental calculation sums in 3 minutes. Focus on speed and precision.",
    entryFee: 0,
    marketingCopy: `➗ *Is Your Child a Maths Genius?*\nJoin the FREE *National Maths Genius Challenge*\nTest your child's mental calculation speed & accuracy!\n\n🏆 Free Certificate + National Rank!`
  },
  {
    id: "gk_genius",
    icon: "🌍",
    badge: "📢 WIDE AUDIENCE REACH",
    title: "General Knowledge Genius Quiz",
    category: "Art / Extra-Curricular" as const,
    description: "Wide-reach general knowledge & curiosity contest. Ideal for Facebook/WhatsApp campaigns and school collaborations as no prior Abacus knowledge is required.",
    rules: "20 Multiple choice questions covering world facts, science, and reasoning. Open to all students age 5-14.",
    entryFee: 0,
    marketingCopy: `🌍 *General Knowledge Genius Quiz*\nJoin the FREE GK Challenge for kids!\nGreat prizes, certificates & skill insights for parents.`
  },
  {
    id: "memory_focus",
    icon: "👀",
    badge: "🧠 WHOLE-BRAIN POSITIONING",
    title: "Memory & Concentration Challenge",
    category: "Mental Math" as const,
    description: "Evaluates visual bead pattern recall, photographic memory, and attention span. Bridges whole-brain development positioning to parent enrollments.",
    rules: "Recall visual number patterns and bead flashes within limited time intervals.",
    entryFee: 0,
    marketingCopy: `👀 *Test Your Child's Memory & Focus!*\nJoin the FREE *Memory & Concentration Challenge*\nDiscover your child's photographic memory potential!`
  },
  {
    id: "logical_reasoning",
    icon: "🧩",
    badge: "💡 FUTURE-READY SKILLS",
    title: "Logical Reasoning & Problem Solving Challenge",
    category: "Vedic Maths" as const,
    description: "Attracts parents interested in analytical thinking, logic puzzles, and future-ready skills beyond standard calculation.",
    rules: "15 Logic puzzles, sequence matrix, and pattern completion questions.",
    entryFee: 0,
    marketingCopy: `🧩 *Logical Reasoning Challenge*\nTest your child's problem solving ability and analytical thinking!\nFree Entry + Digital Certificate!`
  }
];

export default function CompetitionManager({
  currentTeacher,
  onRefreshData
}: CompetitionManagerProps) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "presets" | "create">("list");
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);

  // Form states for creating custom competition
  const [title, setTitle] = useState("Geniplus Brain & IQ Challenge 2026");
  const [category, setCategory] = useState<"Abacus Speed" | "Mental Math" | "Rubik Cube" | "Vedic Maths" | "Art / Extra-Curricular">("Mental Math");
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [description, setDescription] = useState("How Sharp Is Your Child's Brain? Test Concentration, Memory, Maths, Logic & GK for Children Age 5–14.");
  const [entryFee, setEntryFee] = useState<number>(0); // 0 = free
  const [rules, setRules] = useState("30 Questions testing 5 brain dimensions (Concentration, Memory, Maths, Logic, GK). Instant skill breakdown report generated on submission.");
  const [creating, setCreating] = useState(false);

  // Enrollment modal state
  const [enrollCandidate, setEnrollCandidate] = useState<any | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedBatch, setSelectedBatch] = useState<string>("Level 1 Morning Batch");
  const [enrolling, setEnrolling] = useState(false);

  // Copy notification state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/erp/competitions?centerId=${encodeURIComponent(currentTeacher.centerId || "C001")}`);
      const json = await res.json();
      if (json.success) {
        setCompetitions(json.competitions || []);
        if (json.competitions && json.competitions.length > 0 && !selectedComp) {
          setSelectedComp(json.competitions[0]);
        }
      }
    } catch (e) {
      console.error("Error fetching competitions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const handleLaunchPreset = (preset: typeof LEAD_MAGNET_PRESETS[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setDescription(preset.description);
    setRules(preset.rules);
    setEntryFee(preset.entryFee);
    setActiveTab("create");
  };

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        centerId: currentTeacher.centerId || "C001",
        title,
        category,
        eventDate,
        description,
        entryFee,
        rules
      };

      const res = await fetch("/api/erp/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        alert("🎉 Competition Lead Magnet hosted successfully!");
        setActiveTab("list");
        fetchCompetitions();
        if (onRefreshData) onRefreshData();
      } else {
        alert(json.error || "Failed hosting competition.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating competition.");
    } finally {
      setCreating(false);
    }
  };

  const copyPublicRegisterLink = (comp: Competition) => {
    const link = `${window.location.origin}/?view=competition-register&comp=${comp.id}&center=${comp.centerId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(comp.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const copyWhatsAppCampaign = (comp: Competition) => {
    const link = `${window.location.origin}/?view=competition-register&comp=${comp.id}&center=${comp.centerId}`;
    const text = `🧠 *How Sharp Is Your Child's Brain?*\nJoin the FREE *${comp.title}*\nFor Children Age 5–14\n\nTests:\n🎯 Concentration\n🧠 Memory\n➗ Maths\n🧩 Logical Thinking\n🌍 General Knowledge\n\n🏆 Get Score + Rank + Digital Certificate!\n\n👉 Register Free Here: ${link}`;
    navigator.clipboard.writeText(text);
    setCopiedText("wa");
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleEnrollInAbacus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollCandidate) return;
    setEnrolling(true);
    try {
      const res = await fetch("/api/erp/competitions/enroll-abacus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: enrollCandidate.studentId,
          leadId: enrollCandidate.leadId,
          currentLevel: selectedLevel,
          batch: selectedBatch
        })
      });

      const json = await res.json();
      if (json.success) {
        alert(`🎉 ${enrollCandidate.studentName} is now successfully enrolled in Abacus Level ${selectedLevel}!`);
        setEnrollCandidate(null);
        fetchCompetitions();
        if (onRefreshData) onRefreshData();
      } else {
        alert(json.error || "Failed enrolling student.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing enrollment.");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-indigo-600 text-white rounded-2xl shadow-md shadow-amber-200">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
              Extra-Curricular Competitions & Lead Acquisition Funnel
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Attract new parents with high-converting challenges (Brain & IQ, Speed Math, Logic), auto-create student portal accounts, and convert them to paid Abacus students.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-black shrink-0 shadow-3xs">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Auto Student Account Creation Active</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 cursor-pointer ${
            activeTab === "list"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          🏆 Active Competitions ({competitions.length})
        </button>

        <button
          onClick={() => setActiveTab("presets")}
          className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "presets"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Brain className="w-4 h-4 text-indigo-600" />
          Top 5 Lead Magnet Presets
        </button>

        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "create"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Plus className="w-4 h-4" />
          Host Custom Event
        </button>
      </div>

      {/* TAB 1: LIST OF COMPETITIONS & LEADERBOARD */}
      {activeTab === "list" && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-8 text-center text-slate-400 font-bold flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              Loading competitions...
            </div>
          ) : competitions.length === 0 ? (
            <div className="p-10 text-center bg-amber-50/50 rounded-2xl border border-dashed border-amber-200 space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-amber-500/20">
                🧠
              </div>
              <div>
                <p className="text-base font-black text-slate-900 font-display">No Competition Events Published Yet</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Launch the flagship <strong className="text-indigo-600">Geniplus Brain & IQ Challenge</strong> to start attracting new parents into your Abacus enrollment funnel!
                </p>
              </div>
              <button
                onClick={() => setActiveTab("presets")}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                Browse Top 5 Lead Magnet Presets
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Competition Cards (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                {competitions.map((comp) => {
                  const isSelected = selectedComp?.id === comp.id;
                  const guestCount = comp.participants?.filter(p => p.isExternalGuest).length || 0;
                  const totalCount = comp.participants?.length || 0;

                  return (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedComp(comp)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? "bg-amber-50/60 border-amber-400 shadow-md"
                          : "bg-slate-50/70 border-slate-200 hover:border-amber-300"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {comp.category}
                          </span>
                          <h4 className="text-base font-black text-slate-900 font-display mt-1">
                            {comp.title}
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {comp.entryFee === 0 ? "FREE ENTRY" : `₹${comp.entryFee}`}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 font-medium">
                        {comp.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-150">
                        <div>
                          <span className="text-slate-400 block font-semibold">Total Candidates</span>
                          <span className="font-black text-slate-800 font-mono">{totalCount} Registered</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold">Guest Prospects</span>
                          <span className="font-black text-indigo-600 font-mono">{guestCount} Fresh Leads</span>
                        </div>
                      </div>

                      {/* Shareable Link Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPublicRegisterLink(comp);
                          }}
                          className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
                        >
                          {copiedId === comp.id ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                              Link Copied!
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              Copy Registration Link
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyWhatsAppCampaign(comp);
                          }}
                          className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
                        >
                          {copiedText === "wa" ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                              WhatsApp Copy Done!
                            </>
                          ) : (
                            <>
                              <span>WhatsApp Campaign Text 📲</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Selected Competition Details & Leaderboard (7 Cols) */}
              {selectedComp && (
                <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-6">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-black text-amber-600 uppercase tracking-wider font-mono">
                          Official Competition Roster
                        </span>
                        <h3 className="text-xl font-black text-slate-900 font-display">
                          {selectedComp.title}
                        </h3>
                      </div>
                      <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-xl">
                        Event Date: {selectedComp.eventDate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 font-medium">
                      {selectedComp.rules}
                    </p>
                  </div>

                  {/* Leaderboard & Candidates Table */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-500" />
                        Registered Candidates & Student Accounts ({selectedComp.participants?.length || 0})
                      </h4>
                    </div>

                    {(!selectedComp.participants || selectedComp.participants.length === 0) ? (
                      <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400 font-bold space-y-2">
                        <p>No registered candidates yet.</p>
                        <p className="text-[11px] font-medium text-slate-500">
                          Share the guest registration link with parents. Registered candidates will automatically get a Student Portal account and appear here!
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="p-3">Rank</th>
                              <th className="p-3">Student & Phone</th>
                              <th className="p-3">Type</th>
                              <th className="p-3 text-right">Score</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {selectedComp.participants.map((p, idx) => (
                              <tr key={p.id || idx} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-amber-600">
                                  #{idx + 1}
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-900">{p.studentName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    Parent Mobile: {p.parentMobile || "N/A"}
                                  </div>
                                </td>
                                <td className="p-3">
                                  {p.isExternalGuest ? (
                                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                      Guest Prospect
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                      Enrolled Student
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-right font-mono font-black text-emerald-700">
                                  {p.score || 0} pts
                                </td>
                                <td className="p-3 text-right">
                                  {p.isExternalGuest ? (
                                    <button
                                      onClick={() => setEnrollCandidate({
                                        studentId: p.studentId || p.id,
                                        studentName: p.studentName,
                                        parentMobile: p.parentMobile
                                      })}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition-all shadow-xs"
                                    >
                                      Enroll in Abacus 🎓
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-emerald-600 font-bold">Enrolled ✓</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TOP 5 LEAD MAGNET PRESETS */}
      {activeTab === "presets" && (
        <div className="space-y-6">
          <div className="bg-indigo-950 text-white p-6 rounded-2xl space-y-2 border border-indigo-900 shadow-md">
            <span className="text-[10px] font-black tracking-widest uppercase text-amber-400 font-mono">
              High-Converting Growth Strategy
            </span>
            <h3 className="text-xl font-black font-display">
              Top 5 Competition Lead Magnets for Abacus Acquisition
            </h3>
            <p className="text-xs text-indigo-200 leading-relaxed max-w-2xl font-medium">
              Attract parents curious about their child's cognitive development. Click any template below to launch a ready-to-use competition event for your academy!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LEAD_MAGNET_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 hover:border-amber-400 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-2xl">{preset.icon}</span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-mono">
                      {preset.badge}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 font-display">
                    {preset.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => handleLaunchPreset(preset)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Launch Preset Event</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CREATE CUSTOM COMPETITION FORM */}
      {activeTab === "create" && (
        <form onSubmit={handleCreateCompetition} className="space-y-6 max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Competition Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Geniplus Brain & IQ Challenge 2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category / Discipline</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                >
                  <option value="Mental Math">Mental Math & Brain IQ</option>
                  <option value="Abacus Speed">Abacus Speed</option>
                  <option value="Rubik Cube">Rubik's Cube Blitz</option>
                  <option value="Vedic Maths">Vedic Maths / Logic</option>
                  <option value="Art / Extra-Curricular">General Knowledge / Extra-Curricular</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Date</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Entry Fee (₹ - 0 for Free)</label>
              <input
                type="number"
                min={0}
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Description & Perks</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rules & Guidelines</label>
              <textarea
                rows={2}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
              Publish Lead Magnet Competition
            </button>
          </div>
        </form>
      )}

      {/* ABACUS LEVEL ENROLLMENT MODAL */}
      {enrollCandidate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider font-mono">
                  Convert Lead to Enrolled Student
                </span>
                <h3 className="text-lg font-black text-slate-900 font-display">
                  Enroll {enrollCandidate.studentName}
                </h3>
              </div>
              <button
                onClick={() => setEnrollCandidate(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollInAbacus} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Abacus Course Level *
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none text-slate-900"
                >
                  <option value={1}>Level 1 - Direct Bead Addition & Subtraction</option>
                  <option value={2}>Level 2 - Small Friends (5 Complements)</option>
                  <option value={3}>Level 3 - Big Friends (10 Complements)</option>
                  <option value={4}>Level 4 - Combination Formulas & Speed Flash</option>
                  <option value={5}>Level 5 - Multiplication & Rapid Anzan</option>
                  <option value={6}>Level 6 - Division & Multi-digit Addition</option>
                  <option value={7}>Level 7 - Decimals & Advanced Mental Speed</option>
                  <option value={8}>Level 8 - Master Mental Calculation & Square Roots</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Batch / Class Group
                </label>
                <input
                  type="text"
                  required
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  placeholder="e.g. Saturday Morning Batch A"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEnrollCandidate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                >
                  {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  Confirm Enrollment in Level {selectedLevel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
