import React, { useState, useEffect } from "react";
import { Teacher, ExamDefinition, Student, ExamQuestionItem } from "../types";
import { 
  FileCheck2, Plus, Trash2, Edit3, Send, CheckCircle2, 
  Clock, ShieldAlert, Sparkles, BookOpen, AlertCircle, Loader2, Award, Zap, HelpCircle, Calculator
} from "lucide-react";
import { autoEvaluateQuestion, QuestionTypeCategory } from "../utils/questionParser";

interface TeacherExamManagerProps {
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

export default function TeacherExamManager({
  currentTeacher,
  students,
  onRefreshData
}: TeacherExamManagerProps) {
  const [exams, setExams] = useState<ExamDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");

  // Filter level
  const [filterLevel, setFilterLevel] = useState<number | "All">("All");

  // Create form states
  const [title, setTitle] = useState("Level 1 Abacus Benchmark Exam");
  const [level, setLevel] = useState<number>(1);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [passingScore, setPassingScore] = useState<number>(70);
  
  // Custom Questions Drafts
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraftItem[]>([
    { type: "Abacus Sum", input: "2, 2, 5, -3" },
    { type: "Abacus Sum", input: "5, 1, 1, 2" },
    { type: "MCQ", input: "What is the Big Friend of 1?", optionsInput: "9, 8, 7, 6", manualAnswer: "9" },
    { type: "Short Answer", input: "Small friend formula for +4:", manualAnswer: "+5 - 1" }
  ]);

  const [saving, setSaving] = useState(false);

  // Fetch Exams
  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/erp/exam-definitions?centerId=${encodeURIComponent(currentTeacher.centerId || "C001")}`);
      const json = await res.json();
      if (json.success) {
        setExams(json.examDefinitions || []);
      }
    } catch (e) {
      console.error("Failed fetching center exams", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleAddQuestionRow = (type: QuestionTypeCategory = "Abacus Sum") => {
    let defaultInput = "1, 2, 1";
    let optionsInput = "";
    let manualAnswer = "";

    if (type === "Multiplication") defaultInput = "45 * 6";
    else if (type === "Division") defaultInput = "144 / 12";
    else if (type === "Percentage") defaultInput = "15% of 200";
    else if (type === "HCF_LCM") defaultInput = "HCF of 12, 18";
    else if (type === "MCQ") {
      defaultInput = "Big friend of 2 is:";
      optionsInput = "8, 7, 6, 5";
      manualAnswer = "8";
    } else if (type === "Short Answer") {
      defaultInput = "Big friend formula for +9 is:";
      manualAnswer = "+10 - 1";
    }

    setQuestionDrafts([
      ...questionDrafts,
      { type, input: defaultInput, optionsInput, manualAnswer }
    ]);
  };

  const handleRemoveQuestionRow = (idx: number) => {
    setQuestionDrafts(questionDrafts.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: keyof QuestionDraftItem, val: string) => {
    const updated = [...questionDrafts];
    updated[idx] = { ...updated[idx], [field]: val };
    setQuestionDrafts(updated);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questionDrafts.length === 0) {
      alert("Please add at least one question to the exam.");
      return;
    }

    setSaving(true);
    try {
      const parsedQuestions: ExamQuestionItem[] = questionDrafts.map((q, idx) => {
        const evalResult = autoEvaluateQuestion(q.type, q.input, q.optionsInput, q.manualAnswer);
        return {
          id: `Q_${idx + 1}`,
          ...evalResult
        };
      });

      const payload = {
        centerId: currentTeacher.centerId || "C001",
        teacherId: currentTeacher.id,
        teacherName: currentTeacher.name,
        title,
        level: Number(level),
        durationMinutes: Number(durationMinutes),
        passingScore: Number(passingScore),
        totalMarks: parsedQuestions.length * 5,
        questions: parsedQuestions,
        status: "Published"
      };

      const res = await fetch("/api/erp/exam-definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        alert("✅ Level Exam successfully created and published for your center!");
        setActiveTab("list");
        fetchExams();
        if (onRefreshData) onRefreshData();
      } else {
        alert(json.error || "Failed creating exam.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving exam.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;
    try {
      const res = await fetch(`/api/erp/exam-definitions/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchExams();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Assign modal state
  const [selectedExamToAssign, setSelectedExamToAssign] = useState<ExamDefinition | null>(null);
  const [assignScope, setAssignScope] = useState<"batch" | "level" | "student">("batch");
  const [assignStudent, setAssignStudent] = useState<string>("");
  const [assignLevel, setAssignLevel] = useState<number>(1);
  
  const uniqueBatches = Array.from(new Set(students.map(s => s.batch || "Not Assigned").filter(Boolean)));
  const [assignBatch, setAssignBatch] = useState<string>(uniqueBatches[0] || "");
  const [scheduledExamDate, setScheduledExamDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [assignDuration, setAssignDuration] = useState<number>(15);
  const [assignFocusNote, setAssignFocusNote] = useState<string>("Complete all sums carefully within time limit.");
  const [assigning, setAssigning] = useState<boolean>(false);

  // Manual Certificate Issue Modal State
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [certStudentId, setCertStudentId] = useState<string>("");
  const [certTitle, setCertTitle] = useState<string>("Abacus Level 1 Mastery Certificate");
  const [certType, setCertType] = useState<string>("Level Exam");
  const [certLevel, setCertLevel] = useState<number>(1);
  const [certScore, setCertScore] = useState<number>(95);
  const [issuingCert, setIssuingCert] = useState<boolean>(false);

  const handleOpenManualCertForExam = (exam: ExamDefinition) => {
    setCertTitle(`${exam.title} - Official Certificate`);
    setCertType("Level Exam");
    setCertLevel(exam.level);
    setCertScore(exam.passingScore || 70);
    setShowCertModal(true);
  };

  const handleIssueManualCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === certStudentId);
    if (!st) {
      alert("Please select a valid student.");
      return;
    }

    setIssuingCert(true);
    try {
      const res = await fetch("/api/erp/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: currentTeacher.centerId || "C001",
          studentId: st.id,
          studentName: st.studentName,
          title: certTitle,
          certificateType: certType,
          level: certLevel,
          score: certScore,
          approvedBy: currentTeacher.name || "Center Faculty"
        })
      });

      const json = await res.json();
      if (json.success) {
        alert(`🎉 Official Digital Certificate successfully issued to ${st.studentName}! It is now live on their student dashboard.`);
        setShowCertModal(false);
        if (onRefreshData) onRefreshData();
      } else {
        alert(json.error || "Failed issuing certificate.");
      }
    } catch (err) {
      console.error(err);
      alert("Error issuing digital certificate.");
    } finally {
      setIssuingCert(false);
    }
  };

  const handleOpenAssignModal = (exam: ExamDefinition) => {
    setSelectedExamToAssign(exam);
    setAssignLevel(exam.level);
    setAssignDuration(exam.durationMinutes || 15);
    setAssignFocusNote(`Level ${exam.level} Benchmark Exam - Maintain high speed and accuracy.`);
  };

  const handleAssignExamToStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamToAssign) return;

    let targetStudentList: Student[] = [];
    if (assignScope === "student") {
      targetStudentList = students.filter(s => s.id === assignStudent);
    } else if (assignScope === "level") {
      targetStudentList = students.filter(s => Number(s.currentLevel) === Number(assignLevel));
    } else {
      targetStudentList = students.filter(s => (s.batch || "Not Assigned") === assignBatch);
    }

    if (targetStudentList.length === 0) {
      alert("No active students found matching the selected batch, level, or criteria.");
      return;
    }

    setAssigning(true);
    try {
      const payload = {
        studentIds: targetStudentList.map(s => s.id),
        title: `[EXAM] ${selectedExamToAssign.title}`,
        sumsCount: selectedExamToAssign.questions?.length || 20,
        level: selectedExamToAssign.level,
        dueDate: scheduledExamDate,
        scheduledExamDate: scheduledExamDate,
        isExam: true,
        durationMinutes: Number(assignDuration) || 15,
        teacherFocus: assignFocusNote,
        customSums: selectedExamToAssign.questions,
        type: "Exam Paper"
      };

      const res = await fetch("/api/erp/practice-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        const scopeLabel = assignScope === "student" ? targetStudentList[0]?.studentName : assignScope === "level" ? `Level ${assignLevel} Students` : `Batch "${assignBatch}"`;
        alert(`🎉 Successfully scheduled Exam Paper "${selectedExamToAssign.title}" for ${scopeLabel} (${targetStudentList.length} students) on ${scheduledExamDate}!`);
        setSelectedExamToAssign(null);
        if (onRefreshData) onRefreshData();
      } else {
        alert(json.error || "Failed scheduling exam.");
      }
    } catch (err) {
      console.error(err);
      alert("Error scheduling exam paper.");
    } finally {
      setAssigning(false);
    }
  };

  const filteredExams = filterLevel === "All" 
    ? exams 
    : exams.filter(e => Number(e.level) === Number(filterLevel));

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">
                Concept & Level Exam Manager
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Create custom benchmark level exams and test modules for your students.
              </p>
            </div>
          </div>
        </div>

        {/* Center Isolation Badge */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[11px] font-bold text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Center Isolated Data ({currentTeacher.centerId || "C001"})</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 cursor-pointer ${
              activeTab === "list"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            📋 Center Published Exams ({exams.length})
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "create"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Plus className="w-4 h-4" />
            Create New Level Exam
          </button>
        </div>

        {activeTab === "list" && (
          <div className="flex items-center gap-2 pb-2">
            <label className="text-[11px] font-bold text-slate-500">Filter Level:</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value === "All" ? "All" : Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold outline-none"
            >
              <option value="All">All Levels</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                <option key={lvl} value={lvl}>Level {lvl}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: LIST OF EXAMS */}
      {activeTab === "list" && (
        <div className="space-y-4">
          {/* Certification Process Callout Banner */}
          <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
            <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-950 uppercase tracking-wider text-[11px]">
                  Official Digital Certification Workflow
                </span>
                <span className="bg-amber-600 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                  Manual Review & Award
                </span>
              </div>
              <p className="text-amber-900/90 font-medium">
                Review student exam marks and practice performance, then click <strong>Award Cert 📜</strong> or <strong>Issue Certificate</strong> to generate and publish an official verified digital certificate (with your center logo, authorized signature, and MSME/ISO stamps) to the student's dashboard.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCertTitle("Level Exam Mastery Certificate");
                    setShowCertModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Issue Custom Certificate Manually</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 font-bold flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              Loading center level exams...
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No Level Exams Created Yet for this Center</p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Create custom level benchmark exams. When students pass, automated digital certificates are issued directly to their dashboard.
              </p>
              <button
                onClick={() => setActiveTab("create")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" />
                Create Exam Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl p-5 space-y-4 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        Level {exam.level} Benchmark Exam
                      </span>
                      <h4 className="text-base font-black text-slate-900 font-display mt-1">
                        {exam.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] bg-white p-3 rounded-xl border border-slate-150">
                    <div>
                      <span className="text-slate-400 block font-semibold">Questions</span>
                      <span className="font-bold text-indigo-950 font-mono">{exam.questions?.length || 0} Sums</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Duration</span>
                      <span className="font-bold text-indigo-950 font-mono">{exam.durationMinutes} Mins</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Passing Criteria</span>
                      <span className="font-bold text-emerald-600 font-mono">{exam.passingScore}% Marks</span>
                    </div>
                  </div>

                  {/* Auto-cert badge */}
                  <div className="flex items-center gap-2 text-[11px] bg-amber-50/70 border border-amber-200/60 p-2 rounded-xl text-amber-900">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-medium">Auto-issues Level {exam.level} Certificate on passing (≥{exam.passingScore}%)</span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-slate-150">
                    <button
                      type="button"
                      onClick={() => handleOpenManualCertForExam(exam)}
                      className="w-full sm:w-auto px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      title="Directly issue certificate for offline paper takers"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Award Cert 📜</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(exam)}
                      className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Assign / Schedule Exam 📝</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ASSIGN / SCHEDULE EXAM PAPER MODAL */}
      {selectedExamToAssign && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider font-mono">
                  Schedule & Assign Exam Paper
                </span>
                <h3 className="text-lg font-black text-slate-900 font-display">
                  {selectedExamToAssign.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedExamToAssign(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignExamToStudents} className="space-y-4 text-xs">
              {/* Target Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignScope("batch")}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border cursor-pointer transition-all ${
                      assignScope === "batch"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Entire Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignScope("level")}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border cursor-pointer transition-all ${
                      assignScope === "level"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Level Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignScope("student")}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border cursor-pointer transition-all ${
                      assignScope === "student"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Single Student
                  </button>
                </div>
              </div>

              {/* Target Selectors */}
              {assignScope === "batch" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Target Batch
                  </label>
                  <select
                    value={assignBatch}
                    onChange={(e) => setAssignBatch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none text-slate-900"
                  >
                    {uniqueBatches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {assignScope === "level" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Abacus Level
                  </label>
                  <select
                    value={assignLevel}
                    onChange={(e) => setAssignLevel(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none text-slate-900"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                      <option key={lvl} value={lvl}>Level {lvl} Students</option>
                    ))}
                  </select>
                </div>
              )}

              {assignScope === "student" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Individual Student
                  </label>
                  <select
                    value={assignStudent}
                    onChange={(e) => setAssignStudent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none text-slate-900"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.studentName} (Level {s.currentLevel} - {s.batch || 'General'})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Scheduled Exam Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Scheduled Exam Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledExamDate}
                    onChange={(e) => setScheduledExamDate(e.target.value)}
                    className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2.5 font-bold text-amber-950 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Exam Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={assignDuration}
                    onChange={(e) => setAssignDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none text-slate-900"
                  />
                </div>
              </div>

              {/* Focus Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teacher Instructions / Remarks
                </label>
                <textarea
                  rows={2}
                  value={assignFocusNote}
                  onChange={(e) => setAssignFocusNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium outline-none text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedExamToAssign(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Confirm & Schedule Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL CERTIFICATE ISSUANCE MODAL */}
      {showCertModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider font-mono">
                  Certification Process • Direct Award
                </span>
                <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Issue Official Digital Certificate
                </h3>
              </div>
              <button
                onClick={() => setShowCertModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueManualCertificate} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Recipient Student *
                </label>
                <select
                  required
                  value={certStudentId}
                  onChange={(e) => setCertStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none text-slate-900"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentName} (Level {s.currentLevel} - {s.batch || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Certificate Title / Heading *
                </label>
                <input
                  type="text"
                  required
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none text-slate-900"
                  placeholder="e.g. Abacus Level 1 Mastery Certificate"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    value={certType}
                    onChange={(e) => setCertType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none text-slate-900"
                  >
                    <option value="Level Exam">Level Exam</option>
                    <option value="Competition">Competition</option>
                    <option value="Merit Award">Merit Award</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Level
                  </label>
                  <select
                    value={certLevel}
                    onChange={(e) => setCertLevel(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none text-slate-900"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                      <option key={lvl} value={lvl}>Level {lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Score / Marks (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={certScore}
                    onChange={(e) => setCertScore(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Instant Certificate Delivery
                </p>
                <p>
                  This digital certificate will be instantly formatted with your center's logo, ISO accreditation stamp, MSME registry number, and digital authorized signature, and published on the student's dashboard.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuingCert}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {issuingCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                  Issue Official Digital Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE EXAM FORM */}
      {activeTab === "create" && (
        <form onSubmit={handleSaveExam} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Exam Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Level 1 Direct Movement Final Benchmark"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Abacus Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                  <option key={lvl} value={lvl}>Level {lvl}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min={5}
                max={120}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Passing Percentage (%)</label>
              <input
                type="number"
                min={40}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
              />
            </div>
          </div>

          {/* Question Equations Builder */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  Exam Questions & Sum Builder ({questionDrafts.length} Questions)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Support Abacus Addition/Subtraction, Level 4+ Multiplication, Level 6+ Division, Percentage, HCF/LCM, MCQs & Short Answer formulas.
                </p>
              </div>

              {/* Quick Add Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddQuestionRow("Abacus Sum")}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="w-3 h-3 text-indigo-600" /> Abacus Sum
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestionRow("Multiplication")}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  title="Recommended for Level 4+"
                >
                  <Zap className="w-3 h-3 text-indigo-600" /> Multiplication (L4+)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestionRow("Division")}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  title="Recommended for Level 6+"
                >
                  <Sparkles className="w-3 h-3 text-purple-600" /> Division (L6+)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestionRow("Percentage")}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  % Percentage
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestionRow("HCF_LCM")}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  HCF / LCM
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestionRow("MCQ")}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <HelpCircle className="w-3 h-3 text-blue-600" /> MCQ
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestionRow("Short Answer")}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  Short Answer
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {questionDrafts.map((draft, idx) => {
                const evalResult = autoEvaluateQuestion(
                  draft.type,
                  draft.input,
                  draft.optionsInput,
                  draft.manualAnswer
                );

                return (
                  <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <span className="w-6 h-6 rounded-full bg-slate-100 font-mono text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        {/* Question Type Selector */}
                        <select
                          value={draft.type}
                          onChange={(e) => handleQuestionChange(idx, "type", e.target.value as QuestionTypeCategory)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none"
                        >
                          <option value="Abacus Sum">Abacus Sum (Add/Sub)</option>
                          <option value="Multiplication">Multiplication (L4+)</option>
                          <option value="Division">Division (L6+)</option>
                          <option value="Percentage">Percentage</option>
                          <option value="HCF_LCM">HCF & LCM</option>
                          <option value="MCQ">Multiple Choice (MCQ)</option>
                          <option value="Short Answer">Short Answer / Concept</option>
                        </select>
                      </div>

                      {/* Evaluated Badge & Delete */}
                      <div className="flex items-center gap-3 shrink-0 text-xs">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono">
                          Ans: {String(evalResult.answer)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestionRow(idx)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                          title="Remove Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inputs area based on Type */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs">
                      {/* Question Expression / Prompt Input */}
                      <div className={draft.type === "MCQ" ? "md:col-span-5" : draft.type === "Short Answer" ? "md:col-span-7" : "md:col-span-12"}>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          {draft.type === "MCQ" || draft.type === "Short Answer" ? "Question Prompt / Concept" : "Expression / Raw Equation"}
                        </label>
                        <input
                          type="text"
                          value={draft.input}
                          onChange={(e) => handleQuestionChange(idx, "input", e.target.value)}
                          placeholder={
                            draft.type === "Abacus Sum" ? "e.g. 2, 2, 5, -3" :
                            draft.type === "Multiplication" ? "e.g. 45 * 6 or 45 x 6" :
                            draft.type === "Division" ? "e.g. 144 / 12 or 144 ÷ 12" :
                            draft.type === "Percentage" ? "e.g. 15% of 200" :
                            draft.type === "HCF_LCM" ? "e.g. HCF of 12, 18 or LCM of 4, 6" :
                            draft.type === "MCQ" ? "e.g. Big friend of 1 is:" :
                            "e.g. Small friend formula for +4:"
                          }
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs font-bold w-full outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>

                      {/* MCQ Options Input */}
                      {draft.type === "MCQ" && (
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            Options (Comma-separated)
                          </label>
                          <input
                            type="text"
                            value={draft.optionsInput || ""}
                            onChange={(e) => handleQuestionChange(idx, "optionsInput", e.target.value)}
                            placeholder="e.g. 9, 8, 7, 6"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs font-bold w-full outline-none focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                      )}

                      {/* Manual Answer for MCQ or Short Answer */}
                      {(draft.type === "MCQ" || draft.type === "Short Answer") && (
                        <div className={draft.type === "MCQ" ? "md:col-span-3" : "md:col-span-5"}>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            Correct Answer
                          </label>
                          <input
                            type="text"
                            value={draft.manualAnswer || ""}
                            onChange={(e) => handleQuestionChange(idx, "manualAnswer", e.target.value)}
                            placeholder="e.g. 9 or +5 - 1"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs font-bold w-full outline-none focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>
                      )}
                    </div>

                    {/* Preview line */}
                    <div className="text-[11px] text-slate-500 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                      <span className="text-indigo-600 font-bold">Preview:</span>
                      <span className="font-mono font-bold text-slate-800">{evalResult.expression}</span>
                      {draft.type === "MCQ" && evalResult.options && (
                        <span className="text-slate-400 text-[10px]">
                          [{evalResult.options.join(" | ")}]
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publish Exam to Center
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
