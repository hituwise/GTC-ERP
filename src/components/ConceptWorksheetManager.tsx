import React, { useState, useEffect } from "react";
import { Student, Teacher, ConceptWorksheet } from "../types";
import { 
  Sparkles, BookOpen, Plus, Trash2, Edit3, Send, CheckSquare, 
  AlertCircle, Save, RotateCcw, ListPlus, Loader2, ArrowRight, CheckCircle2 
} from "lucide-react";

interface ConceptWorksheetManagerProps {
  currentTeacher: Teacher;
  students: Student[];
  onRefreshData?: () => Promise<void>;
}

export default function ConceptWorksheetManager({
  currentTeacher,
  students,
  onRefreshData
}: ConceptWorksheetManagerProps) {
  const [worksheets, setWorksheets] = useState<ConceptWorksheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"library" | "create">("library");

  // Filter level state
  const [filterLevel, setFilterLevel] = useState<number | "All">(1);

  // Form states for creating/editing worksheet
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wsTitle, setWsTitle] = useState("");
  const [wsLevel, setWsLevel] = useState<number>(1);
  const [wsConceptName, setWsConceptName] = useState("");
  
  // Array of sum drafts
  const [sumDrafts, setSumDrafts] = useState<string[]>([
    "1, 2, -1", // direct +1, +2, -1
    "2, 2, -3",
    "3, 1, -2"
  ]);

  // Assignment states
  const [selectedWs, setSelectedWs] = useState<ConceptWorksheet | null>(null);
  const [assignScope, setAssignScope] = useState<"student" | "level" | "batch">("batch");
  const [assignStudent, setAssignStudent] = useState("");
  const [assignLevel, setAssignLevel] = useState<number>(1);
  
  const uniqueBatches = Array.from(new Set(students.map(s => s.batch || "Sat 10:00 AM")));
  const [assignBatch, setAssignBatch] = useState(uniqueBatches[0] || "Sat 10:00 AM");
  
  const [assignFocus, setAssignFocus] = useState("Visualize direct bead movements on your abacus. Focus on speed!");
  const [assignDueDate, setAssignDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3); // 3 days due by default
    return d.toISOString().split("T")[0];
  });
  const [assignLoading, setAssignLoading] = useState(false);

  // Fetch worksheets on mount
  const fetchWorksheets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/erp/custom-worksheets");
      const json = await res.json();
      if (json.success) {
        setWorksheets(json.customWorksheets || []);
        // Auto-select first worksheet if available
        if (json.customWorksheets && json.customWorksheets.length > 0) {
          setSelectedWs(json.customWorksheets[0]);
        }
      }
    } catch (e) {
      console.error("Failed fetching custom worksheets", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorksheets();
  }, []);

  // Determine relevant students based on role
  const teacherStudents = (currentTeacher.role === "Center Admin" || currentTeacher.role === "Manager" || currentTeacher.role === "Manager + Teacher")
    ? students
    : students.filter(s => s.teacherId === currentTeacher.id || s.centerId === currentTeacher.centerId);

  // Sync default target student
  useEffect(() => {
    if (teacherStudents.length > 0 && !assignStudent) {
      setAssignStudent(teacherStudents[0].id);
    }
  }, [teacherStudents, assignStudent]);

  // Parse draft comma string to sum details
  const parseSumText = (text: string) => {
    const parts = text.split(/[,,| ]+/).map(p => p.trim()).filter(Boolean);
    const rows: number[] = [];
    let sumVal = 0;
    
    parts.forEach(p => {
      const parsed = parseInt(p, 10);
      if (!isNaN(parsed)) {
        rows.push(parsed);
        sumVal += parsed;
      }
    });

    const expression = rows.map((n, idx) => {
      if (idx === 0) return `${n}`;
      return n < 0 ? ` - ${Math.abs(n)}` : ` + ${n}`;
    }).join("");

    return {
      expression: expression || "0",
      answer: sumVal,
      rows
    };
  };

  // Add sum row draft
  const handleAddSumRow = () => {
    setSumDrafts(prev => [...prev, ""]);
  };

  // Remove sum row draft
  const handleRemoveSumRow = (index: number) => {
    setSumDrafts(prev => prev.filter((_, idx) => idx !== index));
  };

  // Update sum row draft
  const handleSumDraftChange = (index: number, val: string) => {
    const updated = [...sumDrafts];
    updated[index] = val;
    setSumDrafts(updated);
  };

  // Save / Update worksheet
  const handleSaveWorksheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsTitle.trim()) {
      alert("Please specify a worksheet title.");
      return;
    }
    if (sumDrafts.filter(d => d.trim()).length === 0) {
      alert("Please add at least one valid sum equation.");
      return;
    }

    const compiledSums = sumDrafts
      .filter(d => d.trim())
      .map(draft => parseSumText(draft));

    const payload = {
      title: wsTitle.trim(),
      level: Number(wsLevel),
      conceptName: wsConceptName.trim() || "General Practice",
      sums: compiledSums,
      createdByTeacherId: currentTeacher.id,
      createdByTeacherName: currentTeacher.name,
      centerId: currentTeacher.centerId || "C001"
    };

    setLoading(true);
    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/erp/custom-worksheets/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/erp/custom-worksheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const json = await res.json();
      if (json.success) {
        alert(editingId ? "Worksheet updated successfully!" : "Concept worksheet saved to reusable library!");
        setEditingId(null);
        setWsTitle("");
        setWsConceptName("");
        setSumDrafts(["1, 2, -1", "2, 2, -3", "3, 1, -2"]);
        setActiveTab("library");
        await fetchWorksheets();
      } else {
        alert("Error: " + json.error);
      }
    } catch (err) {
      console.error("Failed saving custom worksheet", err);
      alert("Error saving to server database.");
    } finally {
      setLoading(false);
    }
  };

  // Edit action
  const handleEditClick = (ws: ConceptWorksheet) => {
    setEditingId(ws.id);
    setWsTitle(ws.title);
    setWsLevel(ws.level);
    setWsConceptName(ws.conceptName);
    
    // Map existing sums back to comma drafts
    const drafts = ws.sums.map(s => {
      if (s.rows && s.rows.length > 0) {
        return s.rows.join(", ");
      }
      return `${s.expression} = ${s.answer}`;
    });
    setSumDrafts(drafts);
    setActiveTab("create");
  };

  // Delete action
  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reusable worksheet from the library?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/erp/custom-worksheets/${id}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.success) {
        alert("Worksheet deleted successfully!");
        if (selectedWs?.id === id) {
          setSelectedWs(null);
        }
        await fetchWorksheets();
      }
    } catch (e) {
      console.error("Failed deleting worksheet", e);
    } finally {
      setLoading(false);
    }
  };

  // Assign to Student / Batch
  const handleAssignWorksheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWs) {
      alert("Please select a concept worksheet first.");
      return;
    }

    let targetStudentIds: string[] = [];
    let scopeLabel = "";

    if (assignScope === "student") {
      if (!assignStudent) {
        alert("Please select a student.");
        return;
      }
      targetStudentIds = [assignStudent];
      const found = students.find(s => s.id === assignStudent);
      scopeLabel = found ? found.studentName : assignStudent;
    } else if (assignScope === "level") {
      const matching = teacherStudents.filter(s => s.currentLevel === Number(assignLevel));
      if (matching.length === 0) {
        alert(`No students currently in Level ${assignLevel} assigned to you.`);
        return;
      }
      targetStudentIds = matching.map(s => s.id);
      scopeLabel = `all ${matching.length} students in Level ${assignLevel}`;
    } else if (assignScope === "batch") {
      const matching = teacherStudents.filter(s => s.batch === assignBatch);
      if (matching.length === 0) {
        alert(`No students found in batch "${assignBatch}" assigned to you.`);
        return;
      }
      targetStudentIds = matching.map(s => s.id);
      scopeLabel = `all ${matching.length} students in batch "${assignBatch}"`;
    }

    setAssignLoading(true);
    try {
      const res = await fetch("/api/erp/practice-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: targetStudentIds,
          title: selectedWs.title,
          sumsCount: selectedWs.sums.length,
          level: selectedWs.level,
          dueDate: assignDueDate,
          teacherFocus: assignFocus,
          digits: 1,
          rows: 3,
          type: "Addition",
          customSums: selectedWs.sums // Send the manual custom sums list!
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully deployed manual practice worksheet "${selectedWs.title}" to ${scopeLabel}! 🚀`);
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        alert(`Failed assigning: ${data.error || "Server error"}`);
      }
    } catch (err) {
      console.error("Failed assigning practice worksheet", err);
      alert("Error sending assignment request to server.");
    } finally {
      setAssignLoading(false);
    }
  };

  const filteredWorksheets = worksheets.filter(w => {
    if (filterLevel === "All") return true;
    return w.level === filterLevel;
  });

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-6" id="concept-practice-manager">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-lg font-black text-indigo-900 font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            Concept-wise Level 1 Digital Practice Manager
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Input custom weekly equations matching Level 1 milestones (such as direct movements, 5 bead usage). Catalog, edit, and reuse saved worksheets across current and upcoming student batches.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => {
              setActiveTab("library");
              setEditingId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === "library"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Saved Concept Library ({worksheets.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("create");
              setEditingId(null);
              setWsTitle("");
              setWsConceptName("");
              setSumDrafts(["1, 2, -1", "2, 2, -3", "3, 1, -2"]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === "create" && !editingId
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Concept Worksheet
          </button>
        </div>
      </div>

      {activeTab === "library" ? (
        /* TAB 1: WORKSHEET REUSE LIBRARY */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: List & Filters (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <label className="text-xs font-black text-slate-600">Filter Level</label>
              <div className="flex gap-1">
                {[1, 2, "All"].map(lv => (
                  <button
                    key={lv}
                    onClick={() => setFilterLevel(lv as any)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                      filterLevel === lv
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {lv === "All" ? "All Levels" : `L${lv}`}
                  </button>
                ))}
              </div>
            </div>

            {loading && worksheets.length === 0 ? (
              <div className="text-center py-12 flex justify-center items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Loading worksheets library...</span>
              </div>
            ) : filteredWorksheets.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No concept worksheets cataloged yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Create your first custom manual worksheet matching Level 1 learning modules!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
                {filteredWorksheets.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => setSelectedWs(ws)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex justify-between items-start gap-4 ${
                      selectedWs?.id === ws.id
                        ? "border-indigo-600 bg-indigo-50/25 shadow-sm"
                        : "border-slate-150 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Level {ws.level}</span>
                        <span className="text-[9px] font-bold text-slate-400">{ws.conceptName}</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-indigo-950 mt-1 truncate">{ws.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {ws.sums?.length || 0} manual sums • By {ws.createdByTeacherName || "System"}
                      </p>
                    </div>
                    
                    {/* Action buttons (Visible on selected or hover) */}
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(ws);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                        title="Edit sums"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(ws.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                        title="Remove worksheet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: Active Worksheet Preview & Batch Assignment Form (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50/50 border border-slate-150 rounded-2xl p-5 space-y-6">
            {selectedWs ? (
              <>
                {/* Preview Head */}
                <div className="border-b border-slate-150 pb-4">
                  <div className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest">Selected Practice Worksheet</div>
                  <h4 className="text-sm font-black text-indigo-950 mt-1">{selectedWs.title}</h4>
                  <div className="flex gap-4 text-[10px] text-slate-400 font-semibold mt-1 font-mono">
                    <span>Level: {selectedWs.level}</span>
                    <span>•</span>
                    <span>Concept: {selectedWs.conceptName}</span>
                    <span>•</span>
                    <span>Total Sums: {selectedWs.sums?.length || 0}</span>
                  </div>
                </div>

                {/* Sums Scroll list */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Sum Equations & Answer Keys</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {selectedWs.sums?.map((sum, index) => (
                      <div key={index} className="bg-white border border-slate-150 rounded-xl p-2.5 text-center shadow-2xs">
                        <div className="text-[8px] font-black text-indigo-500 font-mono">SUM #{index + 1}</div>
                        <div className="text-xs font-bold text-slate-700 mt-1 font-display">
                          {sum.expression}
                        </div>
                        <div className="mt-1.5 pt-1 border-t border-slate-100 text-xs font-black text-emerald-600 font-mono">
                          Answer: {sum.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 1-Click Reuse & Assign Form */}
                <div className="border-t border-slate-150 pt-5 space-y-4">
                  <div className="flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                      Reuse & Deploy to Student Batches (1-Click Assignment)
                    </span>
                  </div>
                  
                  <form onSubmit={handleAssignWorksheet} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    
                    {/* 1. Scope select */}
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Target Scope</label>
                      <select
                        value={assignScope}
                        onChange={(e) => setAssignScope(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium"
                      >
                        <option value="batch">Batch-wise (Upcoming/Current)</option>
                        <option value="student">Student-wise (Individual remedial)</option>
                        <option value="level">Level-wise (Full Level roster)</option>
                      </select>
                    </div>

                    {/* 2. Target element */}
                    {assignScope === "batch" && (
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Select Batch</label>
                        <select
                          value={assignBatch}
                          onChange={(e) => setAssignBatch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium"
                        >
                          {uniqueBatches.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {assignScope === "student" && (
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Select Student</label>
                        <select
                          value={assignStudent}
                          onChange={(e) => setAssignStudent(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium"
                        >
                          <option value="">-- Choose student --</option>
                          {teacherStudents.map(s => (
                            <option key={s.id} value={s.id}>{s.studentName} (L{s.currentLevel} • {s.batch})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {assignScope === "level" && (
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Target Course Level</label>
                        <select
                          value={assignLevel}
                          onChange={(e) => setAssignLevel(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                            <option key={l} value={l}>Level {l}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* 3. Due Date */}
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Practice Due Date</label>
                      <input
                        type="date"
                        value={assignDueDate}
                        onChange={(e) => setAssignDueDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold"
                      />
                    </div>

                    {/* 4. Focus Note */}
                    <div className="md:col-span-2">
                      <label className="block text-slate-500 font-bold mb-1">Instructions & Mentor Focus Note</label>
                      <textarea
                        value={assignFocus}
                        onChange={(e) => setAssignFocus(e.target.value)}
                        placeholder="Instructions for abacus finger movements..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium h-14"
                      />
                    </div>

                    {/* Submit Btn */}
                    <div className="md:col-span-2 text-right pt-2">
                      <button
                        type="submit"
                        disabled={assignLoading}
                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 ml-auto"
                      >
                        {assignLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Deploy Practice Drill to Students 🚀</span>
                      </button>
                    </div>

                  </form>
                </div>
              </>
            ) : (
              <div className="text-center py-24 text-slate-400 text-xs italic">
                Please select a worksheet from the catalog library on the left to review sums and deploy it.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* TAB 2: CREATE / EDIT WORKSHEET */
        <form onSubmit={handleSaveWorksheet} className="space-y-6">
          <div className="bg-slate-50 rounded-2xl border border-slate-150 p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Title */}
            <div>
              <label className="block font-black text-slate-600 mb-1.5">Worksheet Title / Name</label>
              <input
                type="text"
                value={wsTitle}
                onChange={(e) => setWsTitle(e.target.value)}
                placeholder="e.g. Level 1 - Week 3: Direct Combination Practice"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-indigo-950 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>

            {/* Level Select */}
            <div>
              <label className="block font-black text-slate-600 mb-1.5">Target Level</label>
              <select
                value={wsLevel}
                onChange={(e) => setWsLevel(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-indigo-950 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                  <option key={l} value={l}>Level {l}</option>
                ))}
              </select>
            </div>

            {/* Concept Theme Name */}
            <div>
              <label className="block font-black text-slate-600 mb-1.5">Concept Topic (Weekly Topic)</label>
              <input
                type="text"
                value={wsConceptName}
                onChange={(e) => setWsConceptName(e.target.value)}
                placeholder="e.g. Direct Addition (No formula)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-indigo-950 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Interactive Manual Sum Builder */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Input Manual Practice Sums</h4>
                <p className="text-[10px] text-slate-500">
                  Type a list of comma or space-separated numbers (positive and negative, e.g. <code className="font-mono bg-slate-100 px-1 rounded">2, 2, -1</code>) representing the bead movements per row.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSumRow}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0"
              >
                <ListPlus className="w-3.5 h-3.5" />
                Add Sum Row
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sumDrafts.map((draft, idx) => {
                const parsed = parseSumText(draft);
                return (
                  <div key={idx} className="bg-white border-2 border-slate-150 rounded-2xl p-4 space-y-3 relative hover:border-indigo-300 transition-all">
                    
                    {/* Floating delete index */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-mono text-[10px] font-black text-indigo-600">SUM EQUATION {idx + 1}</span>
                      {sumDrafts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSumRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded"
                          title="Delete Sum"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Equation Row string inputs */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Input Rows</label>
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => handleSumDraftChange(idx, e.target.value)}
                        placeholder="e.g. 5, 2, -1, 3"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>

                    {/* Equation visual output and autocalculated answer */}
                    <div className="bg-slate-50/70 rounded-xl p-2 text-center text-xs space-y-1 border border-slate-100">
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Interactive Formula Display</div>
                      <div className="font-display font-black text-indigo-950 text-sm">
                        {parsed.expression || "0"}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 font-extrabold flex justify-center items-center gap-1 mt-1 bg-emerald-50 py-0.5 rounded-lg border border-emerald-100">
                        <CheckSquare className="w-3 h-3 text-emerald-500" />
                        <span>Calculated Answer: {parsed.answer}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-slate-100 pt-5 flex justify-end gap-3.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab("library");
                setEditingId(null);
              }}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setSumDrafts(["1, 2, -1", "2, 2, -3", "3, 1, -2"])}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Drafts
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingId ? "Save Worksheet Changes" : "Save Reusable Worksheet to Library"}</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
