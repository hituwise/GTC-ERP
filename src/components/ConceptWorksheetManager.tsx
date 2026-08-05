import React, { useState, useEffect } from "react";
import { Student, Teacher, ConceptWorksheet, ExamQuestionItem } from "../types";
import { printElementById } from "../lib/printUtils";
import { 
  Sparkles, BookOpen, Plus, Trash2, Edit3, Send, CheckSquare, 
  AlertCircle, Save, RotateCcw, ListPlus, Loader2, ArrowRight, CheckCircle2, Zap, HelpCircle, Calculator 
} from "lucide-react";
import { autoEvaluateQuestion, QuestionTypeCategory } from "../utils/questionParser";

interface ConceptWorksheetManagerProps {
  currentTeacher: Teacher;
  students: Student[];
  onRefreshData?: () => Promise<void>;
}

interface QuestionDraftItem {
  type: QuestionTypeCategory;
  input: string;
  optionsInput?: string;
  manualAnswer?: string;
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
  const [filterLevel, setFilterLevel] = useState<number | "All">("All");

  // Form states for creating/editing worksheet
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wsTitle, setWsTitle] = useState("");
  const [wsLevel, setWsLevel] = useState<number>(1);
  const [wsConceptName, setWsConceptName] = useState("");
  
  // Array of sum drafts
  const [sumDrafts, setSumDrafts] = useState<QuestionDraftItem[]>([
    { type: "Abacus Sum", input: "1, 2, -1" },
    { type: "Abacus Sum", input: "2, 2, -3" },
    { type: "Multiplication", input: "45 * 6" },
    { type: "Division", input: "144 / 12" },
    { type: "MCQ", input: "Big friend of 1 is:", optionsInput: "9, 8, 7, 6", manualAnswer: "9" }
  ]);

  // Assignment states
  const [selectedWs, setSelectedWs] = useState<ConceptWorksheet | null>(null);
  const [assignScope, setAssignScope] = useState<"student" | "level" | "batch">("batch");
  const [assignStudent, setAssignStudent] = useState("");
  const [assignLevel, setAssignLevel] = useState<number>(1);
  const [isExamPaper, setIsExamPaper] = useState<boolean>(false);
  const [scheduledExamDate, setScheduledExamDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  
  const uniqueBatchCodes = Array.from(new Set(students.map(s => s.batchCode).filter((code): code is string => Boolean(code && code.trim()))));
  const uniqueBatches = Array.from(new Set(students.map(s => s.batch || "Not Assigned").filter(Boolean)));
  const [assignBatch, setAssignBatch] = useState(uniqueBatchCodes[0] || uniqueBatches[0] || "");
  
  const [assignFocus, setAssignFocus] = useState("Visualize direct bead movements on your abacus. Focus on speed!");
  const [assignDueDate, setAssignDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3); // 3 days due by default
    return d.toISOString().split("T")[0];
  });
  const [assignLoading, setAssignLoading] = useState(false);

  // Worksheet Print states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [includeAnswers, setIncludeAnswers] = useState(true);

  // Perform abacus worksheet quality auditing
  const runWorksheetAudit = (sums: any[]) => {
    let negativeIntermediateSum = 0;
    let excessiveDigitSum = 0;
    let fiveBeadActiveSum = 0;

    sums.forEach((s) => {
      let val = 0;
      if (s.rows) {
        s.rows.forEach((r: number) => {
          val += r;
          if (val < 0) {
            negativeIntermediateSum++;
          }
          if (val > 9) {
            excessiveDigitSum++;
          }
          if (val >= 5 && val <= 9) {
            fiveBeadActiveSum++;
          }
        });
      }
    });

    return {
      negativeIntermediateSum,
      excessiveDigitSum,
      fiveBeadActiveSum,
      isLevel1Compliant: negativeIntermediateSum === 0 && excessiveDigitSum === 0,
      auditPassed: negativeIntermediateSum === 0
    };
  };

  // Fetch worksheets on mount (Master Academy Library + Center Tagged)
  const fetchWorksheets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/erp/custom-worksheets?centerId=${encodeURIComponent(currentTeacher.centerId || "C001")}`);
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

  // Add sum row draft with optional type
  const handleAddSumRow = (type: QuestionTypeCategory = "Abacus Sum") => {
    let defaultInput = "1, 2, 1";
    let optionsInput = "";
    let manualAnswer = "";

    if (type === "Multiplication") defaultInput = "45 * 6";
    else if (type === "Division") defaultInput = "144 / 12";
    else if (type === "Percentage") defaultInput = "15% of 200";
    else if (type === "HCF_LCM") defaultInput = "HCF of 12, 18";
    else if (type === "MCQ") {
      defaultInput = "Big friend of 1 is:";
      optionsInput = "9, 8, 7, 6";
      manualAnswer = "9";
    } else if (type === "Short Answer") {
      defaultInput = "Small friend formula for +4:";
      manualAnswer = "+5 - 1";
    }

    setSumDrafts(prev => [...prev, { type, input: defaultInput, optionsInput, manualAnswer }]);
  };

  // Remove sum row draft
  const handleRemoveSumRow = (index: number) => {
    setSumDrafts(prev => prev.filter((_, idx) => idx !== index));
  };

  // Update sum row draft
  const handleSumDraftChange = (index: number, field: keyof QuestionDraftItem, val: string) => {
    const updated = [...sumDrafts];
    updated[index] = { ...updated[index], [field]: val };
    setSumDrafts(updated);
  };

  // Save / Update worksheet
  const handleSaveWorksheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsTitle.trim()) {
      alert("Please specify a worksheet title.");
      return;
    }
    if (sumDrafts.length === 0) {
      alert("Please add at least one question or sum equation.");
      return;
    }

    const compiledSums: ExamQuestionItem[] = sumDrafts.map(draft => 
      autoEvaluateQuestion(draft.type, draft.input, draft.optionsInput, draft.manualAnswer)
    );

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
        setSumDrafts([
          { type: "Abacus Sum", input: "1, 2, -1" },
          { type: "Abacus Sum", input: "2, 2, -3" },
          { type: "Multiplication", input: "45 * 6" }
        ]);
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
    
    // Map existing sums back to QuestionDraftItems
    const drafts: QuestionDraftItem[] = (ws.sums || []).map(s => {
      const qType: QuestionTypeCategory = (s as any).questionType || (s.rows && s.rows.length > 0 ? "Abacus Sum" : "Abacus Sum");
      let inputVal = s.expression || "";
      if (s.rows && s.rows.length > 0) {
        inputVal = s.rows.join(", ");
      }
      return {
        type: qType,
        input: inputVal,
        optionsInput: s.options ? s.options.join(", ") : "",
        manualAnswer: s.answer !== undefined ? String(s.answer) : ""
      };
    });

    setSumDrafts(drafts.length > 0 ? drafts : [{ type: "Abacus Sum", input: "1, 2, -1" }]);
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

  const normalizeBatch = (batchStr: string): string => {
    if (!batchStr) return "";
    let s = batchStr.toLowerCase();
    s = s.replace(/monday/g, "mon");
    s = s.replace(/tuesday/g, "tue");
    s = s.replace(/wednesday/g, "wed");
    s = s.replace(/thursday/g, "thu");
    s = s.replace(/thurs/g, "thu");
    s = s.replace(/friday/g, "fri");
    s = s.replace(/saturday/g, "sat");
    s = s.replace(/sunday/g, "sun");
    s = s.replace(/and/g, "");
    s = s.replace(/&/g, "");
    s = s.replace(/[^a-z0-9]/g, "");
    return s;
  };

  const isBatchMatch = (b1: string, b2: string): boolean => {
    if (!b1 || !b2) return false;
    if (b1 === b2) return true;
    return normalizeBatch(b1) === normalizeBatch(b2);
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
      if (!assignBatch) {
        alert("Please select a batch or batch code.");
        return;
      }
      const matching = teacherStudents.filter(s =>
        s.batchCode === assignBatch ||
        s.batch === assignBatch ||
        isBatchMatch(s.batch || "", assignBatch) ||
        isBatchMatch(s.batchCode || "", assignBatch)
      );
      if (matching.length === 0) {
        alert(`No students found in batch/code "${assignBatch}" assigned to you.`);
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
          scheduledExamDate: scheduledExamDate || assignDueDate,
          isExam: isExamPaper,
          durationMinutes: 15,
          teacherFocus: assignFocus,
          digits: 1,
          rows: 3,
          type: "Addition",
          customSums: selectedWs.sums // Send the manual custom sums list!
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(isExamPaper 
          ? `Successfully scheduled Exam Paper "${selectedWs.title}" for ${scopeLabel} on ${scheduledExamDate}! 📝`
          : `Successfully deployed practice worksheet "${selectedWs.title}" to ${scopeLabel}! 🚀`);
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
            Concept-wise Digital Practice Manager
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Input custom weekly equations matching level milestones (such as direct movements, 5 bead usage, small friend, big friend, combo). Catalog, edit, and reuse saved worksheets across current and upcoming student batches.
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
              setSumDrafts([
                { type: "Abacus Sum", input: "1, 2, -1" },
                { type: "Abacus Sum", input: "2, 2, -3" },
                { type: "Multiplication", input: "45 * 6" }
              ]);
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
              <div className="flex gap-1 flex-wrap">
                {["All", 1, 2, 3, 4, 5, 6, 7, 8].map(lv => (
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

                {/* Advanced Quality Audit & Print Desk */}
                {(() => {
                  const audit = runWorksheetAudit(selectedWs.sums || []);
                  return (
                    <div className="bg-white border border-slate-150 rounded-2xl p-4 space-y-4 shadow-3xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                            Abacus Quality Audit Report
                          </span>
                          <div className="flex items-center gap-1.5">
                            {audit.auditPassed ? (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Passed Physical Solvability
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-150 px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                Bead Complements Needed
                              </span>
                            )}
                            {audit.isLevel1Compliant ? (
                              <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded uppercase">
                                Level 1 Perfect
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded uppercase">
                                Multi-Level Combos
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowPrintModal(true)}
                          className="bg-indigo-950 hover:bg-indigo-900 text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                        >
                          <span>Print Student Worksheet 🖨️</span>
                        </button>
                      </div>

                      {/* Audit Details */}
                      <div className="grid grid-cols-2 gap-4 text-[11px] border-t border-slate-100 pt-3 text-slate-600 font-medium">
                        <div>
                          <p className="font-extrabold text-slate-700">Complements & Carryovers</p>
                          <p className="text-slate-400 mt-0.5">
                            {audit.negativeIntermediateSum > 0 
                              ? `⚠️ Found ${audit.negativeIntermediateSum} steps going sub-zero. Recommended adjustment.`
                              : "✓ 100% physically solvable. No sub-zero bead steps detected."}
                          </p>
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-700">Five Bead (Upper Deck) Usage</p>
                          <p className="text-slate-400 mt-0.5">
                            {audit.fiveBeadActiveSum > 0 
                              ? `Found ${audit.fiveBeadActiveSum} rows requiring 5-bead activation.`
                              : "Pure lower-deck direct bead movements only."}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
                          <option value="">-- Choose Batch / Batch Code --</option>
                          {uniqueBatchCodes.length > 0 && (
                            <optgroup label="🏷️ Batch Codes (Teacher / Center Assigned)">
                              {uniqueBatchCodes.map(code => (
                                <option key={code} value={code}>Code: {code}</option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="⏰ Timetable Batch Timings">
                            {uniqueBatches.map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </optgroup>
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
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                            <option key={l} value={l}>Level {l}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Mode selector */}
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Deployment Mode</label>
                      <select
                        value={isExamPaper ? "exam" : "practice"}
                        onChange={(e) => setIsExamPaper(e.target.value === "exam")}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-indigo-950"
                      >
                        <option value="practice">Digital Practice Drill</option>
                        <option value="exam">📝 Scheduled Level Exam Paper</option>
                      </select>
                    </div>

                    {/* 3. Dates */}
                    {isExamPaper ? (
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Scheduled Exam Date *</label>
                        <input
                          type="date"
                          required
                          value={scheduledExamDate}
                          onChange={(e) => setScheduledExamDate(e.target.value)}
                          className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2 font-bold text-amber-900"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Practice Due Date</label>
                        <input
                          type="date"
                          value={assignDueDate}
                          onChange={(e) => setAssignDueDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold"
                        />
                      </div>
                    )}

                    {/* 4. Focus Note */}
                    <div className="md:col-span-2">
                      <label className="block text-slate-500 font-bold mb-1">Instructions & Mentor Focus Note</label>
                      <textarea
                        value={assignFocus}
                        onChange={(e) => setAssignFocus(e.target.value)}
                        placeholder="Instructions for exam/practice..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium h-14"
                      />
                    </div>

                    {/* Submit Btn */}
                    <div className="md:col-span-2 text-right pt-2">
                      <button
                        type="submit"
                        disabled={assignLoading}
                        className={`w-full md:w-auto text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 ml-auto cursor-pointer ${
                          isExamPaper ? "bg-amber-600 hover:bg-amber-500" : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        {assignLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{isExamPaper ? "Schedule & Assign Exam Paper 📝" : "Deploy Practice Drill to Students 🚀"}</span>
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
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(l => (
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
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  Worksheet Questions & Practice Builder ({sumDrafts.length} Questions)
                </h4>
                <p className="text-[10px] text-slate-500">
                  Build custom practice drills for Abacus Addition/Subtraction, Level 4+ Multiplication, Level 6+ Division, Percentage, HCF/LCM, MCQs & Short Answer.
                </p>
              </div>

              {/* Quick Add Presets */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddSumRow("Abacus Sum")}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="w-3 h-3 text-indigo-600" /> Abacus Sum
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSumRow("Multiplication")}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  title="Recommended for Level 4+"
                >
                  <Zap className="w-3 h-3 text-indigo-600" /> Multiplication (L4+)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSumRow("Division")}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  title="Recommended for Level 6+"
                >
                  <Sparkles className="w-3 h-3 text-purple-600" /> Division (L6+)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSumRow("Percentage")}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  % Percentage
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSumRow("HCF_LCM")}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  HCF / LCM
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSumRow("MCQ")}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <HelpCircle className="w-3 h-3 text-blue-600" /> MCQ
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSumRow("Short Answer")}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  Short Answer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sumDrafts.map((draft, idx) => {
                const evalResult = autoEvaluateQuestion(
                  draft.type,
                  draft.input,
                  draft.optionsInput,
                  draft.manualAnswer
                );

                return (
                  <div key={idx} className="bg-white border-2 border-slate-150 rounded-2xl p-4 space-y-3 relative hover:border-indigo-300 transition-all shadow-2xs">
                    
                    {/* Floating delete index */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-black text-indigo-600">Q#{idx + 1}</span>
                        <select
                          value={draft.type}
                          onChange={(e) => handleSumDraftChange(idx, "type", e.target.value as QuestionTypeCategory)}
                          className="bg-slate-50 border border-slate-200 rounded-md text-[10px] font-extrabold text-slate-700 px-1.5 py-0.5 outline-none"
                        >
                          <option value="Abacus Sum">Abacus Add/Sub</option>
                          <option value="Multiplication">Multiplication (L4+)</option>
                          <option value="Division">Division (L6+)</option>
                          <option value="Percentage">Percentage</option>
                          <option value="HCF_LCM">HCF & LCM</option>
                          <option value="MCQ">MCQ</option>
                          <option value="Short Answer">Short Answer</option>
                        </select>
                      </div>

                      {sumDrafts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSumRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                          title="Delete Sum"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Expression / Input */}
                    <div className="space-y-1 text-xs">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        {draft.type === "MCQ" || draft.type === "Short Answer" ? "Question Prompt" : "Raw Expression / Sum"}
                      </label>
                      <input
                        type="text"
                        value={draft.input}
                        onChange={(e) => handleSumDraftChange(idx, "input", e.target.value)}
                        placeholder={
                          draft.type === "Abacus Sum" ? "e.g. 2, 2, 5, -3" :
                          draft.type === "Multiplication" ? "e.g. 45 * 6" :
                          draft.type === "Division" ? "e.g. 144 / 12" :
                          draft.type === "Percentage" ? "e.g. 15% of 200" :
                          draft.type === "HCF_LCM" ? "e.g. HCF of 12, 18" :
                          draft.type === "MCQ" ? "e.g. Big friend of 1 is:" :
                          "e.g. Small friend formula for +4:"
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>

                    {/* MCQ Options */}
                    {draft.type === "MCQ" && (
                      <div className="space-y-1 text-xs">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Options (Comma-separated)</label>
                        <input
                          type="text"
                          value={draft.optionsInput || ""}
                          onChange={(e) => handleSumDraftChange(idx, "optionsInput", e.target.value)}
                          placeholder="e.g. 9, 8, 7, 6"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                        />
                      </div>
                    )}

                    {/* Manual Answer for MCQ / Short Answer */}
                    {(draft.type === "MCQ" || draft.type === "Short Answer") && (
                      <div className="space-y-1 text-xs">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Correct Answer</label>
                        <input
                          type="text"
                          value={draft.manualAnswer || ""}
                          onChange={(e) => handleSumDraftChange(idx, "manualAnswer", e.target.value)}
                          placeholder="e.g. 9 or +5 - 1"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                        />
                      </div>
                    )}

                    {/* Equation visual output and autocalculated answer */}
                    <div className="bg-slate-50/70 rounded-xl p-2 text-center text-xs space-y-1 border border-slate-100">
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Interactive Formula Display</div>
                      <div className="font-display font-black text-indigo-950 text-xs truncate">
                        {evalResult.expression || "0"}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 font-extrabold flex justify-center items-center gap-1 mt-1 bg-emerald-50 py-0.5 rounded-lg border border-emerald-100">
                        <CheckSquare className="w-3 h-3 text-emerald-500" />
                        <span>Calculated Answer: {String(evalResult.answer)}</span>
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

      {/* Worksheet Printing Desk Modal */}
      {showPrintModal && selectedWs && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 md:p-8 max-w-4xl w-full shadow-2xl space-y-6">
            
            {/* Control Panel (Hidden during printing) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 no-print">
              <div>
                <h3 className="text-base font-black text-indigo-950 font-display flex items-center gap-1.5">
                  Print Custom Abacus Worksheet
                </h3>
                <p className="text-xs text-slate-500">Configure parameters, then click Print. Only the worksheet page itself will print.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAnswers}
                    onChange={(e) => setIncludeAnswers(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span>Include Teacher's Answer Key</span>
                </label>

                <button
                  type="button"
                  onClick={() => printElementById("printable-worksheet-modal", "Abacus Concept Worksheet")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>Print Now 🖨️</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>

            {/* PRINT WRAPPER START (This block is targeted by print media css) */}
            <div id="printable-worksheet-modal" className="bg-white p-6 border border-slate-200 rounded-2xl max-h-[500px] overflow-y-auto print:max-h-none print:overflow-visible print:border-0 print:p-0">
              
              {/* CSS Print Rules Injection */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-worksheet-modal, #printable-worksheet-modal * {
                    visibility: visible !important;
                  }
                  #printable-worksheet-modal {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-height: none !important;
                    overflow: visible !important;
                    background: white !important;
                    color: black !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    z-index: 999999 !important;
                  }
                  .no-print, .print\:hidden {
                    display: none !important;
                  }
                  .print-break {
                    page-break-before: always !important;
                    break-before: page !important;
                  }
                }
              `}</style>

              {/* Student Worksheet Page */}
              <div className="space-y-8 bg-white text-slate-900 p-4">
                
                {/* Official Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-wider font-display text-indigo-950">{localStorage.getItem("academy_name") || "Abacus"} Abacus Learning</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">{selectedWs.title}</p>
                    <p className="text-[10px] font-semibold text-slate-400">Concept: {selectedWs.conceptName} • Level {selectedWs.level}</p>
                  </div>
                  <div className="text-right text-[11px] font-semibold text-slate-500 space-y-0.5">
                    <p>Date: ____________________</p>
                    <p>Batch: ____________________</p>
                  </div>
                </div>

                {/* Name / Metadata Row */}
                <div className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-3 text-xs font-bold text-slate-700">
                  <div>Student Name: _______________________</div>
                  <div>Level: L{selectedWs.level}</div>
                  <div className="text-right">Total Marks: _____ / {selectedWs.sums?.length || 0}</div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Instructions: Solve the vertical bead additions and subtractions below. Write your answers clearly in the boxes.</p>
                  
                  {/* Vertical Abacus sums grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-6 pt-4">
                    {selectedWs.sums?.map((sum, index) => (
                      <div key={index} className="border border-slate-350 rounded-xl p-3 flex flex-col items-center justify-between min-h-[140px] bg-white text-slate-900 shadow-3xs">
                        <span className="text-[9px] font-black font-mono text-slate-400 mb-2">({index + 1})</span>
                        
                        {/* Stacking the sum rows vertically */}
                        <div className="flex-1 flex flex-col justify-center items-center font-display font-bold text-base tracking-widest leading-relaxed">
                          {sum.rows?.map((rowVal: number, rIdx: number) => (
                            <div key={rIdx} className="text-center font-black">
                              {rowVal > 0 && rIdx > 0 ? `+${rowVal}` : rowVal}
                            </div>
                          ))}
                        </div>

                        {/* Double line for totals and answer box */}
                        <div className="w-full border-t border-slate-400 mt-2 pt-2">
                          <div className="w-full h-8 border-2 border-slate-800 rounded-lg bg-slate-50"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score Tracker & Teacher Notes */}
                <div className="border-t border-slate-200 pt-6 mt-8 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                  <div>
                    <p className="font-bold text-slate-700">Trainer Observations:</p>
                    <div className="border-b border-slate-200 h-6 mt-2"></div>
                    <div className="border-b border-slate-200 h-6 mt-2"></div>
                  </div>
                  <div className="text-right flex flex-col justify-end">
                    <p>Verified by Trainer: _____________________</p>
                    <p className="mt-1">Date Evaluated: _____________________</p>
                  </div>
                </div>
              </div>

              {/* Teacher's Answer Key (Page Break) */}
              {includeAnswers && (
                <div className="print-break border-t-2 border-dashed border-slate-300 pt-8 mt-12 bg-slate-50/50 p-4 rounded-xl">
                  <div className="flex justify-between items-center border-b border-slate-400 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black uppercase text-indigo-950 font-display font-black">Teacher's Evaluation Key (Confidential)</h3>
                      <p className="text-[10px] text-slate-400 font-bold">Matching: {selectedWs.title}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2.5 py-0.5 rounded uppercase">Evaluation Tool</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {selectedWs.sums?.map((sum, index) => (
                      <div key={index} className="bg-white border border-emerald-100 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono shadow-2xs">
                        <span className="font-extrabold text-slate-400">Sum #{index + 1}:</span>
                        <span className="font-black text-emerald-600 text-sm">{sum.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
