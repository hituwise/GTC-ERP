import React, { useState } from "react";
import { generateAbacusSums, getLocalizedInstructions, AbacusSum } from "../abacusGenerator";
import { Printer, Eye, EyeOff, Sparkles, AlertCircle, FileText, Download, CheckCircle, RefreshCw } from "lucide-react";
import { printElementById } from "../lib/printUtils";

export default function PracticeGeneratorView() {
  const [level, setLevel] = useState<number>(1);
  const [practiceType, setPracticeType] = useState<string>("Mixed Addition & Subtraction");
  const [digits, setDigits] = useState<number>(1);
  const [rows, setRows] = useState<number>(3);
  const [numSums, setNumSums] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [language, setLanguage] = useState<"English" | "Hindi" | "Gujarati">("English");
  
  const [title, setTitle] = useState<string>("Abacus Academy Mental Math Worksheet");
  const [studentName, setStudentName] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split("T")[0]);

  const [generatedSums, setGeneratedSums] = useState<AbacusSum[]>(() => {
    return generateAbacusSums(1, "Mixed Addition & Subtraction", 1, 3, 10, "Medium");
  });
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);

  // Synchronize defaults on level change
  const handleLevelChange = (newLevel: number) => {
    setLevel(newLevel);
    // Auto adjust digits and type constraints to maintain curriculum compliance
    if (newLevel === 1) {
      setDigits(1);
      if (practiceType === "Multiplication" || practiceType === "Division") {
        setPracticeType("Mixed Addition & Subtraction");
      }
    } else if (newLevel === 2) {
      setDigits(Math.min(2, digits));
      if (practiceType === "Multiplication" || practiceType === "Division") {
        setPracticeType("Mixed Addition & Subtraction");
      }
    } else if (newLevel === 3) {
      setDigits(Math.min(2, digits));
      if (practiceType === "Multiplication" || practiceType === "Division") {
        setPracticeType("Mixed Addition & Subtraction");
      }
    } else if (newLevel === 4 || newLevel === 5) {
      if (practiceType === "Division") setPracticeType("Multiplication");
    }
  };

  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleGenerate = () => {
    const sums = generateAbacusSums(level, practiceType, digits, rows, numSums, difficulty);
    setGeneratedSums(sums);
    setSavedSuccess(false);
  };

  const handleSaveToLibrary = async () => {
    setSaving(true);
    try {
      const compiledSums = generatedSums.map(s => ({
        id: s.id,
        expression: s.expression,
        rows: s.numbers,
        correctAnswer: String(s.correctAnswer),
        marks: 1,
        type: "Abacus Sum"
      }));

      const payload = {
        title: title || `Level ${level} Practice Sheet`,
        level: Number(level),
        conceptName: `${practiceType} (${difficulty})`,
        sums: compiledSums,
        createdByTeacherId: "T_GENERATED",
        createdByTeacherName: "Auto Generator",
        centerId: "GLOBAL"
      };

      const res = await fetch("/api/erp/custom-worksheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        alert("Failed saving worksheet: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Save worksheet error:", err);
      alert("Error saving worksheet to server database.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    printElementById("printable-practice-worksheet-content", title);
  };

  const isMultiplicationAllowed = level >= 4;
  const isDivisionAllowed = level >= 6;

  const instructions = getLocalizedInstructions(practiceType, level, language);

  return (
    <div className="space-y-8 print:p-0" id="practice-generator-view">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #practice-generator-view, #practice-generator-view * {
            visibility: visible !important;
          }
          #practice-generator-view {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            z-index: 999999 !important;
          }
          .print\:hidden, .print-hidden, .no-print {
            display: none !important;
          }
        }
      `}</style>
      {/* Parameters Panel (Hidden on Print) */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm print:hidden">
        <h2 className="text-xl font-black text-indigo-900 font-display flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          AI Abacus Content Engine & Worksheet Generator
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Generate fully curriculum-compliant, age-appropriate worksheets for Abacus Levels 1 to 8. Formulated with zero-negative subtraction safety checks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Level Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Abacus Level (1-8)</label>
            <select
              value={level}
              onChange={(e) => handleLevelChange(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              id="level-select"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>

          {/* Practice Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Practice Type</label>
            <select
              value={practiceType}
              onChange={(e) => setPracticeType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              id="practice-type-select"
            >
              <option value="Mixed Addition & Subtraction">Mixed Add & Sub</option>
              <option value="Addition">Addition Only</option>
              <option value="Subtraction">Subtraction Only</option>
              {isMultiplicationAllowed && <option value="Multiplication">Multiplication</option>}
              {isDivisionAllowed && <option value="Division">Division</option>}
              <option value="Speed Practice">Speed Practice</option>
              <option value="Flash Practice">Flash Practice</option>
              <option value="Oral Practice">Oral Practice</option>
              <option value="Exam Practice">Exam Practice</option>
            </select>
          </div>

          {/* Digits Limit */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Digits per Number</label>
            <select
              value={digits}
              onChange={(e) => setDigits(Number(e.target.value))}
              disabled={level === 1}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              id="digits-select"
            >
              {[1, 2, 3, 4, 5].map(d => (
                <option key={d} value={d}>{d} Digit{d > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>

          {/* Rows count */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Number of Rows (Sum Depth)</label>
            <select
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              disabled={practiceType === "Multiplication" || practiceType === "Division"}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              id="rows-select"
            >
              {[3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map(r => (
                <option key={r} value={r}>{r} Rows</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Number of sums */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Number of Sums</label>
            <select
              value={numSums}
              onChange={(e) => setNumSums(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              id="num-sums-select"
            >
              {[5, 10, 15, 20, 25, 30, 40, 50].map(n => (
                <option key={n} value={n}>{n} Sums</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Difficulty Profile</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              id="difficulty-select"
            >
              <option value="Easy">Easy (Static beads)</option>
              <option value="Medium">Medium (Standard Formulas)</option>
              <option value="Hard">Hard (Speed mixed drills)</option>
            </select>
          </div>

          {/* Language selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Worksheet Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              id="language-select"
            >
              <option value="English">English</option>
              <option value="Hindi">हिन्दी (Hindi)</option>
              <option value="Gujarati">ગુજરાતી (Gujarati)</option>
            </select>
          </div>

          {/* Custom title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Worksheet Custom Header</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Review Worksheet"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              id="worksheet-title-input"
            />
          </div>
        </div>

        {/* Info Box about Curricular Compliance */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-amber-800 text-xs flex gap-2 items-start mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Strict level-rules enforced: </span>
            {level === 1 && "Level 1 is restricted to direct bead movements with 1 digit sums. Small & Big Friends formulas are excluded."}
            {level === 2 && "Level 2 allows random 1-2 digit sums using Small Friends and Big Friends rules."}
            {level === 3 && "Level 3 introduces multi-digit speed development sequences."}
            {level >= 4 && level < 6 && "Level 4-5 unlocks curriculum-aligned Multiplication (2D x 1D, 3D x 1D)."}
            {level >= 6 && "Level 6-8 unlocks Abacus division structures (3D ÷ 1D, 4D ÷ 2D)."}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3 justify-end border-t border-gray-100 pt-4 items-center">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Saved & Synchronized to Library!</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveToLibrary}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            id="save-to-library-btn"
          >
            <Download className="w-4 h-4" />
            <span>{saving ? "Saving to Database..." : "Save Worksheet to Library"}</span>
          </button>
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
            id="toggle-answers-btn"
          >
            {showAnswerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAnswerKey ? "Hide Answer Key" : "Show Answer Key"}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
            id="print-btn"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
            id="generate-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Re-Generate Worksheet
          </button>
        </div>
      </div>

      {/* Printable Sheet Frame */}
      <div id="printable-practice-worksheet-content" className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-8 max-w-4xl mx-auto print:border-0 print:shadow-none print:p-0">
        
        {/* Paper Header */}
        <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight uppercase">
            {title}
          </h1>
          <div className="flex justify-between text-xs text-slate-600 font-mono mt-3 max-w-xl mx-auto print:max-w-full">
            <div><span className="font-bold">LEVEL:</span> Abacus Level {level}</div>
            <div><span className="font-bold">TYPE:</span> {practiceType}</div>
            <div><span className="font-bold">LANG:</span> {language}</div>
          </div>
        </div>

        {/* Student details space */}
        <div className="grid grid-cols-2 gap-4 text-sm font-semibold mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 uppercase tracking-wider text-xs font-bold font-mono">Student Name:</span>
            <input
              type="text"
              placeholder="___________________________"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="border-b border-transparent focus:border-gray-300 font-display outline-none text-gray-800 placeholder-slate-400 print:placeholder-transparent"
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-gray-500 uppercase tracking-wider text-xs font-bold font-mono">Date:</span>
            <input
              type="text"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="border-b border-transparent text-right outline-none text-gray-800 focus:border-gray-300 font-mono"
            />
          </div>
        </div>

        {/* Printable Instructions */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8 print:bg-white print:border-l-4 print:border-l-slate-900 print:rounded-none">
          <div className="text-xs font-extrabold font-mono text-slate-400 uppercase tracking-wider mb-1">Worksheet Instructions</div>
          <p className="text-sm font-medium text-slate-800 leading-relaxed">{instructions}</p>
        </div>

        {/* Arithmetic Rows Rendering (Bento Grid) */}
        {practiceType === "Multiplication" || practiceType === "Division" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-8 gap-x-4 mb-8">
            {generatedSums.map((sum) => (
              <div key={sum.id} className="border border-slate-100 rounded-xl p-4 flex flex-col justify-between min-h-[100px] text-center bg-gray-50 print:bg-white print:border-slate-300">
                <div className="text-xs font-extrabold font-mono text-indigo-600 mb-1">SUM {sum.id}</div>
                <div className="text-xl font-bold font-display text-slate-900">
                  {sum.rows.join(" ")}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <div className="text-xs font-mono text-slate-400 uppercase">Answer</div>
                  <div className={`text-base font-bold font-mono ${showAnswerKey ? "text-emerald-600" : "text-transparent border-b border-slate-300 select-none min-h-[24px]"}`}>
                    {sum.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Standard Vertical Abacus Rows Columns */
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-x-2 gap-y-6 mb-8">
            {generatedSums.map((sum) => (
              <div key={sum.id} className="flex flex-col text-center border-r border-slate-100 last:border-0 print:border-slate-200 p-1">
                <div className="text-[10px] font-extrabold font-mono text-indigo-600 mb-2">Q {sum.id}</div>
                <div className="space-y-1 flex-1 font-display text-base font-bold text-slate-800">
                  {sum.rows.map((row, rIdx) => (
                    <div key={rIdx} className="font-semibold">{row}</div>
                  ))}
                </div>
                
                {/* Result Input Space */}
                <div className="mt-4 pt-3 border-t-2 border-slate-900">
                  <div className={`font-mono text-sm font-bold ${showAnswerKey ? "text-emerald-600" : "text-transparent select-none min-h-[20px] bg-slate-50 print:bg-transparent rounded"}`}>
                    {sum.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paper Footer */}
        <div className="text-center text-[10px] text-gray-400 font-mono border-t border-gray-100 pt-4 flex justify-between">
          <span>Abacus Academy ERP System Worksheet Generator (Levels 1 to 8)</span>
          <span>Approved by Curriculum Design Committee</span>
        </div>
      </div>
    </div>
  );
}
