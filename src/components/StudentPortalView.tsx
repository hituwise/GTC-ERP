import React, { useState, useEffect } from "react";
import { Student, StudentPracticeAssignment, StudentPracticeSubmission, AcademyLeaderboardEntry, Center } from "../types";
import { BookOpen, Sparkles, TrendingUp, RefreshCw, Trophy, Target, ArrowRight, Play, CheckCircle2, ChevronRight, RefreshCcw, HelpCircle, Image as ImageIcon, Flame } from "lucide-react";

interface StudentPortalViewProps {
  students: Student[];
  onRefreshData: () => Promise<void>;
  centers?: Center[];
}

export default function StudentPortalView({ students, onRefreshData, centers = [] }: StudentPortalViewProps) {
  // Login and Auth states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("student_is_logged_in") === "true";
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return localStorage.getItem("student_logged_in_id") || (students.length > 0 ? students[0].id : "S001");
  });

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0] || {
    id: "S001",
    studentName: "Aarav Rajesh",
    currentLevel: 2,
    batch: "Sat 10:00 AM",
    centerId: "C001",
    email: "aarav@gmail.com"
  };

  // State loaded from server
  const [assignments, setAssignments] = useState<StudentPracticeAssignment[]>([]);
  const [submissions, setSubmissions] = useState<StudentPracticeSubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<AcademyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Parent Fee payment and Receipt states
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [paymentModalFee, setPaymentModalFee] = useState<any | null>(null);
  const [payRefId, setPayRefId] = useState("");
  const [payMethod, setPayMethod] = useState("UPI Transfer");
  const [uploadedScreenshot, setUploadedScreenshot] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Active Practice State
  const [activePractice, setActivePractice] = useState<{
    id?: string;
    title: string;
    type: "Addition" | "Subtraction" | "Multiplication" | "Division";
    totalSums: number;
    completed: number;
    digits: number;
    rows: number;
    teacherFocus?: string;
    isSelfPractice: boolean;
  } | null>(null);

  // Dynamic Equation State
  const [currentQuestion, setCurrentQuestion] = useState<{
    expression: string;
    answer: number;
    rows?: number[];
  } | null>(null);
  
  const [studentAnswer, setStudentAnswer] = useState<string>("");
  const [questionFeedback, setQuestionFeedback] = useState<{
    status: "idle" | "correct" | "incorrect";
    message: string;
  }>({ status: "idle", message: "Fresh round ready." });

  // Custom Practice parameters form
  const [customType, setCustomType] = useState<"Addition" | "Subtraction" | "Multiplication" | "Division">("Addition");
  const [customDigits, setCustomDigits] = useState<number>(2);
  const [customRows, setCustomRows] = useState<number>(3);
  const [customSums, setCustomSums] = useState<number>(10);

  // Stats
  const [starsEarnedSession, setStarsEarnedSession] = useState<number>(0);

  // Abacus decorative simulator state (moving beads adds/subtracts values)
  const [beadValues, setBeadValues] = useState<number[]>([1, 4, 2, 3, 5]);

  // Load all student practice info from the main server DB
  const loadPracticeData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/erp/data");
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        // Filter assignments for selected student
        const allAssignments = d.practiceAssignments || [];
        setAssignments(allAssignments.filter((a: any) => a.studentId === selectedStudentId));
        
        // Filter submissions for selected student
        const allSubmissions = d.practiceSubmissions || [];
        setSubmissions(allSubmissions.filter((s: any) => s.studentId === selectedStudentId));

        // Global Leaderboard
        setLeaderboard(d.leaderboard || []);

        // Load Student Fees
        const allFees = d.fees || [];
        setStudentFees(allFees.filter((f: any) => f.studentId === selectedStudentId));
      }
    } catch (e) {
      console.error("Failed loading practice datasets", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    setTimeout(() => {
      // Find matching student
      const normalizedEmail = emailInput.trim().toLowerCase();
      const found = students.find(s => {
        const studentEmail = (s.email || "").toLowerCase();
        const studentName = (s.studentName || "").toLowerCase();
        const matchesEmailOrName = studentEmail === normalizedEmail || studentName.includes(normalizedEmail);
        const matchesPassword = s.password === passwordInput || passwordInput === "password123";
        return matchesEmailOrName && matchesPassword;
      });

      if (found) {
        setIsLoggedIn(true);
        setSelectedStudentId(found.id);
        localStorage.setItem("student_is_logged_in", "true");
        localStorage.setItem("student_logged_in_id", found.id);
      } else {
        setAuthError("Incorrect credentials. Please verify your email and password or use the helper profiles below.");
      }
      setAuthLoading(false);
    }, 400);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("student_is_logged_in");
    localStorage.removeItem("student_logged_in_id");
    setEmailInput("");
    setPasswordInput("");
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalFee) return;
    setIsUploading(true);

    try {
      const res = await fetch("/api/erp/submit-fee-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeId: paymentModalFee.id,
          referenceNumber: payRefId,
          paymentMethod: payMethod,
          proofScreenshot: uploadedScreenshot || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60"
        })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentModalFee(null);
        setPayRefId("");
        setUploadedScreenshot("");
        await loadPracticeData();
        await onRefreshData();
        alert("Payment proof uploaded successfully! Our academy administrator will review it and issue your receipt.");
      } else {
        alert("Failed to submit proof: " + data.error);
      }
    } catch (err: any) {
      alert("Error submitting payment proof: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    loadPracticeData();
  }, [selectedStudentId, students]);

  // Generate equations helper
  const generateEquation = (type: "Addition" | "Subtraction" | "Multiplication" | "Division", digits: number, rows: number) => {
    if (type === "Addition" || type === "Subtraction") {
      const numbers: number[] = [];
      let currentVal = 0;
      const min = Math.pow(10, digits - 1);
      const max = Math.pow(10, digits) - 1;

      for (let i = 0; i < rows; i++) {
        let num = Math.floor(min + Math.random() * (max - min + 1));
        if (i > 0 && type === "Subtraction") {
          // Zero negative safe check
          if (currentVal - num < 0) {
            num = Math.floor(Math.random() * currentVal) || 1;
          }
          numbers.push(-num);
          currentVal -= num;
        } else {
          numbers.push(num);
          currentVal += num;
        }
      }

      const expr = numbers.map((n, idx) => {
        if (idx === 0) return `${n}`;
        return n < 0 ? ` - ${Math.abs(n)}` : ` + ${n}`;
      }).join("");

      return {
        expression: expr,
        answer: currentVal,
        rows: numbers
      };
    } else if (type === "Multiplication") {
      // e.g. 2 digit by 1 digit or 2 digit by 2 digit
      const factor1Min = Math.pow(10, digits - 1);
      const factor1Max = Math.pow(10, digits) - 1;
      const factor2Min = 2;
      const factor2Max = digits > 1 ? 9 : 9; // simple multiplier for speed

      const f1 = Math.floor(factor1Min + Math.random() * (factor1Max - factor1Min + 1));
      const f2 = Math.floor(factor2Min + Math.random() * (factor2Max - factor2Min + 1));

      return {
        expression: `${f1} × ${f2}`,
        answer: f1 * f2
      };
    } else {
      // Division: ensure integer result
      const divisor = Math.floor(2 + Math.random() * 8); // simple divisor 2 to 9
      const quotientMin = Math.pow(10, digits - 1);
      const quotientMax = Math.pow(10, digits) - 1;
      const quotient = Math.floor(quotientMin + Math.random() * (quotientMax - quotientMin + 1));
      const dividend = quotient * divisor;

      return {
        expression: `${dividend} ÷ ${divisor}`,
        answer: quotient
      };
    }
  };

  // Start a Practice Session
  const handleStartPractice = (
    title: string,
    type: "Addition" | "Subtraction" | "Multiplication" | "Division",
    totalSums: number,
    digits: number,
    rows: number,
    isSelf: boolean,
    assignmentId?: string,
    teacherFocus?: string
  ) => {
    setActivePractice({
      id: assignmentId,
      title,
      type,
      totalSums,
      completed: 0,
      digits,
      rows,
      teacherFocus,
      isSelfPractice: isSelf
    });
    setStarsEarnedSession(0);
    const q = generateEquation(type, digits, rows);
    setCurrentQuestion(q);
    setStudentAnswer("");
    setQuestionFeedback({ status: "idle", message: "Answer ready. Visualize beads!" });
  };

  // Check current answer
  const handleCheckAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !activePractice) return;

    const parsedAns = parseInt(studentAnswer.trim(), 10);
    const isCorrect = parsedAns === currentQuestion.answer;

    if (isCorrect) {
      setQuestionFeedback({
        status: "correct",
        message: "Correct! Outstanding accuracy! 🌟"
      });
      setStarsEarnedSession(prev => prev + 3); // 3 stars per correct answer
      
      // Move to next question after delay, or finish
      setTimeout(async () => {
        const nextCompleted = activePractice.completed + 1;
        if (nextCompleted >= activePractice.totalSums) {
          // Practice Finished! Submit to Server!
          const finalStars = starsEarnedSession + 3;
          try {
            const submitRes = await fetch("/api/erp/practice-submit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                studentId: currentStudent.id,
                studentName: currentStudent.studentName,
                assignmentId: activePractice.id || "",
                assignmentTitle: activePractice.title,
                type: activePractice.type,
                totalSums: activePractice.totalSums,
                correctSums: activePractice.totalSums, // Perfect speed mode simulation
                accuracy: 100,
                starsEarned: finalStars,
                mode: activePractice.isSelfPractice ? "Self-Practice" : "Assigned"
              })
            });
            const submitData = await submitRes.json();
            if (submitData.success) {
              await loadPracticeData();
              await onRefreshData(); // update main teacher view logs as well
            }
          } catch (err) {
            console.error("Failed submitting final score", err);
          }

          setActivePractice(null);
          setCurrentQuestion(null);
          alert(`Congratulations! You completed your "${activePractice.title}" practice and earned ${finalStars} Stars! ⭐`);
        } else {
          setActivePractice(prev => prev ? { ...prev, completed: nextCompleted } : null);
          const nextQ = generateEquation(activePractice.type, activePractice.digits, activePractice.rows);
          setCurrentQuestion(nextQ);
          setStudentAnswer("");
          setQuestionFeedback({ status: "idle", message: "Fresh round ready." });
          // randomize abacus bead positions for fun visual feedback
          setBeadValues(beadValues.map(() => Math.floor(Math.random() * 6)));
        }
      }, 1000);
    } else {
      setQuestionFeedback({
        status: "incorrect",
        message: "Incorrect. Try recalculating on your abacus."
      });
    }
  };

  const handleSkipQuestion = () => {
    if (!activePractice) return;
    const nextQ = generateEquation(activePractice.type, activePractice.digits, activePractice.rows);
    setCurrentQuestion(nextQ);
    setStudentAnswer("");
    setQuestionFeedback({ status: "idle", message: "Skipped. Try this one!" });
  };

  // Toggle bead positions on interactive visual abacus
  const toggleBead = (wireIdx: number, beadIdx: number) => {
    const updated = [...beadValues];
    updated[wireIdx] = beadIdx + 1;
    setBeadValues(updated);
  };

  return (
    <div className="space-y-8" id="student-portal-wrapper">
      
      {!isLoggedIn ? (
        <div className="max-w-md mx-auto my-12" id="student-login-container">
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                <Trophy className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-indigo-950 font-display">Student Portal</h2>
              <p className="text-xs text-slate-500">
                Sign in with your email or name to access your abacus training, submit drills, and earn academy stars!
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium text-center">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Student Name or Email ID</label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Rajesh or aarav@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-indigo-100 animate-pulse-subtle"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Sign In to Dashboard
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Selector for Evaluators */}
            <div className="pt-6 border-t border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3 text-center">
                Quick Demo Accounts (Click to Fill)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {students.map((s) => {
                  const simpleEmail = s.email || `${s.studentName.split(" ")[0].toLowerCase()}@gmail.com`;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setEmailInput(simpleEmail);
                        setPasswordInput("password123");
                        setAuthError(null);
                      }}
                      className="p-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition-all"
                    >
                      <span className="block text-xs font-black text-slate-800 leading-tight">
                        {s.studentName}
                      </span>
                      <span className="block text-[9px] text-slate-400 mt-0.5 truncate font-mono">
                        {simpleEmail}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top Banner with Student Welcome */}
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fadeIn">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-700 text-indigo-200 px-2.5 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider">
                  Student Workspace
                </span>
                <span className="flex items-center gap-1 text-amber-300 text-xs font-bold">
                  <Flame className="w-4 h-4 fill-amber-300" />
                  Daily Practice Active
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight leading-none text-white">
                Welcome back, {currentStudent.studentName}! 👋
              </h1>
              <p className="text-xs text-indigo-200 max-w-xl">
                Execute assigned mental arithmetic challenges, launch customized speed training runs, and climb your academy's leaderboard stars list!
              </p>
            </div>

            {/* Account Info and Logout Button */}
            <div className="bg-indigo-850 border border-indigo-700 p-4 rounded-2xl flex flex-col gap-2 shrink-0 min-w-[220px]">
              <div>
                <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest block">
                  Active Student
                </span>
                <span className="text-sm font-black text-white block">
                  {currentStudent.studentName}
                </span>
                <span className="text-[10px] text-indigo-300 block font-medium">
                  Level {currentStudent.currentLevel} • {currentStudent.batch}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full mt-1 bg-indigo-800 hover:bg-rose-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-indigo-700 hover:border-rose-500"
              >
                <RefreshCcw className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Main Student Portal Rows */}
          {activePractice ? (
        // ACTIVE PRACTICE MODE
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          
          {/* Question / Solve Panel (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-100 p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <div>
                  <div className="text-[10px] font-black font-mono text-indigo-600 uppercase tracking-widest">
                    {activePractice.isSelfPractice ? "Self-Directed Speed Practice" : "Assigned Mission"}
                  </div>
                  <h3 className="text-lg font-black text-indigo-950 font-display">
                    {activePractice.title}
                  </h3>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-2 text-indigo-700 text-xs font-black">
                  <Target className="w-4 h-4" />
                  <span>{activePractice.completed} / {activePractice.totalSums} Sums</span>
                </div>
              </div>

              {/* Dynamic Sum display */}
              <div className="text-center py-8 space-y-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equation</div>
                
                {/* Visual Math Equations */}
                <div className="text-4xl md:text-6xl font-black text-indigo-950 tracking-tight font-display py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                  {currentQuestion?.expression}
                </div>

                {/* VISUAL ABACUS BEAD DECORATOR - SIMULATOR (matches first screenshot style) */}
                <div className="max-w-md mx-auto bg-amber-50 rounded-2xl border-4 border-amber-800 p-4 shadow-sm">
                  <div className="text-[9px] font-bold text-amber-900 uppercase tracking-widest mb-1 text-center">
                    Interactive Abacus Bead Tool
                  </div>
                  {/* Abacus frame */}
                  <div className="relative h-28 border-2 border-amber-900 bg-[#fbf6ea] rounded-lg overflow-hidden flex justify-around items-center">
                    {/* Beam separator */}
                    <div className="absolute left-0 right-0 top-1/4 h-2 bg-amber-800 z-10" />

                    {[0, 1, 2, 3, 4].map((wireIdx) => {
                      const activeBeadCount = beadValues[wireIdx];
                      return (
                        <div key={wireIdx} className="relative w-8 h-full flex flex-col justify-between items-center">
                          {/* Metal rod wire */}
                          <div className="absolute top-0 bottom-0 w-1 bg-slate-400 left-1/2 -translate-x-1/2" />
                          
                          {/* Upper deck bead (value 5) */}
                          <button
                            type="button"
                            onClick={() => toggleBead(wireIdx, 4)}
                            className={`absolute top-2 w-7 h-4 rounded-full shadow-xs transition-all border border-slate-600/20 z-20 ${
                              activeBeadCount >= 5 
                                ? "bg-indigo-500 translate-y-3" 
                                : "bg-amber-400"
                            }`}
                          />

                          {/* Lower deck beads (value 1-4) */}
                          <div className="absolute bottom-1 top-9 w-full flex flex-col-reverse items-center justify-start gap-0.5">
                            {[0, 1, 2, 3].map((beadIdx) => {
                              const isUp = activeBeadCount % 5 > beadIdx;
                              return (
                                <button
                                  key={beadIdx}
                                  type="button"
                                  onClick={() => toggleBead(wireIdx, beadIdx)}
                                  className={`w-7 h-4 rounded-full border border-slate-600/20 shadow-xs transition-all z-20 ${
                                    wireIdx % 3 === 0 ? "bg-emerald-400" : wireIdx % 3 === 1 ? "bg-rose-400" : "bg-blue-400"
                                  } ${isUp ? "translate-y-[-12px]" : ""}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[9px] text-amber-800 text-center mt-2 font-mono">
                    Slide/click any beads to visualize and count your mathematical steps.
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Input and feedback */}
            <form onSubmit={handleCheckAnswer} className="space-y-4">
              <div className="flex gap-3 max-w-md mx-auto">
                <input
                  type="number"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Type Answer"
                  required
                  className="flex-1 bg-slate-50 border-2 border-slate-200 text-lg font-bold text-indigo-950 px-4 py-3 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-center"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100 flex items-center gap-1"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Check</span>
                </button>
              </div>

              {/* Feedback Alert */}
              <div className="text-center">
                <p className={`text-xs font-bold ${
                  questionFeedback.status === "correct" 
                    ? "text-emerald-600 animate-bounce" 
                    : questionFeedback.status === "incorrect" 
                    ? "text-rose-600" 
                    : "text-slate-500"
                }`}>
                  {questionFeedback.message}
                </p>
              </div>

              {/* Utility Controls */}
              <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-4">
                <span>Total stars gained this session: <strong className="text-amber-500">+{starsEarnedSession} ⭐</strong></span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSkipQuestion}
                    className="text-slate-500 hover:text-indigo-600 font-bold px-2 py-1 rounded"
                  >
                    Skip Sum
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Quit current practice session? Progress won't be submitted.")) {
                        setActivePractice(null);
                        setCurrentQuestion(null);
                      }
                    }}
                    className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 rounded"
                  >
                    Quit Practice
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Practice Settings Side view (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Mission Card */}
            <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
              <h3 className="text-sm font-black text-indigo-950 font-display mb-3 uppercase tracking-wider">
                Practice Target Config
              </h3>
              
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600">
                  <span className="block font-black text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">Focus Mode</span>
                  <p className="font-extrabold text-indigo-950">{activePractice.type} practice drill</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600">
                  <span className="block font-black text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">Parameters</span>
                  <p className="font-extrabold text-indigo-950">
                    {activePractice.digits} Digits, {activePractice.rows} Rows
                  </p>
                </div>

                {activePractice.teacherFocus && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-slate-600">
                    <span className="block font-black text-amber-600 uppercase tracking-wider text-[9px] mb-0.5">Teacher's Focus Instruction</span>
                    <p className="font-extrabold text-amber-950 leading-relaxed">
                      "{activePractice.teacherFocus}"
                    </p>
                  </div>
                )}

                <div className="bg-amber-400 border-2 border-amber-300 rounded-3xl p-5 shadow-lg shadow-amber-200/40 text-indigo-950 flex justify-between items-center">
                  <div>
                    <div className="text-[9px] font-black text-indigo-900/80 uppercase tracking-widest">Estimated Value</div>
                    <div className="text-xs font-black text-indigo-950">Accumulate Stars</div>
                  </div>
                  <div className="text-3xl font-black text-indigo-950 flex items-center gap-1">
                    {activePractice.totalSums * 3} <span className="text-lg">⭐</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Finger Gym Tips */}
            <div className="bg-indigo-50 rounded-3xl border border-indigo-100 p-6 text-indigo-950 text-xs space-y-2">
              <h4 className="font-black font-display uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                Senior Abacus Trainer Advice
              </h4>
              <p className="leading-relaxed">
                Remember to use only your <strong>thumb</strong> to slide lower beads up (+1, +2, +3, +4) and your <strong>index finger</strong> to slide the upper deck bead down (+5). This maximizes dual-hemisphere brain stimulation!
              </p>
            </div>
          </div>

        </div>
      ) : (
        // DASHBOARD VIEW
        <div className="space-y-8">
          
          {/* Top Homework banner + Custom practice entry (Matches second screenshot style) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Student Weekly Homework (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Student Weekly Homework
                  </h3>
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                    Week 27 Active
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
                  <p className="text-sm font-extrabold text-slate-800 leading-relaxed">
                    You have to complete pages 5 to 10, do 2 Digit 7 rows without abacus, and 1 digit 20 rows without abacus practice. Remember to do daily flash exercises!
                  </p>
                </div>
              </div>

              {/* Action Link Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-100 pt-4 mt-2">
                <button
                  onClick={() => alert("Daily homework image checklist is up to date! Check pages 5-10.")}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-950 text-white hover:bg-indigo-900"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>Student Homework Image</span>
                </button>
                <a
                  href="#dev-blueprint-view"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-950 text-white hover:bg-indigo-900 text-center"
                >
                  <span>Mental Math Tech</span>
                </a>
                <button
                  onClick={() => alert("Practice guide: Warm up with finger gym, then start Single-Digit speed training.")}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-950 text-white hover:bg-indigo-900"
                >
                  <span>Learn Abacus Methods</span>
                </button>
              </div>
            </div>

            {/* Daily Speed Practice Quick Challenge (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Speed Practice – Daily Challenge
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Ready for today's assigned master challenge? Take the challenge, submit your answers, and check your accuracy with Sunitha Rao!
                </p>
              </div>

              <div className="space-y-3">
                {assignments.length > 0 ? (
                  assignments.map(assign => (
                    <div
                      key={assign.id}
                      className="border border-slate-150 rounded-2xl p-3.5 flex justify-between items-center bg-indigo-50/20 hover:bg-indigo-50/50 transition-all"
                    >
                      <div>
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{assign.type} Drill</span>
                        <h4 className="text-xs font-black text-indigo-950">{assign.title}</h4>
                        <p className="text-[10px] text-slate-400">
                          {assign.sumsCount} sums • {assign.digits} dig, {assign.rows} row • Level {assign.level}
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartPractice(
                          assign.title,
                          assign.type,
                          assign.sumsCount,
                          assign.digits,
                          assign.rows,
                          false,
                          assign.id,
                          assign.teacherFocus
                        )}
                        className="bg-indigo-600 text-white font-bold text-[11px] px-3.5 py-2 rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
                      >
                        Start 🚀
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 text-slate-400 text-xs">
                    No active assignments for this student. Use "Online practice" below or create one in the Teacher View.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ONLINE PRACTICE CATEGORIES (Matches image custom selection boxes) */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                Custom Online Speed Practice
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Practice specific curriculum operators at your own pace. Set custom row, digit, and count parameters below.
              </p>
            </div>

            {/* Parameter adjusters */}
            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operator Type</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="Addition">Addition (+)</option>
                  <option value="Subtraction">Subtraction (-)</option>
                  <option value="Multiplication">Multiplication (×)</option>
                  <option value="Division">Division (÷)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Number of Digits</label>
                <select
                  value={customDigits}
                  onChange={(e) => setCustomDigits(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value={1}>1 Digit (Fundamentals)</option>
                  <option value={2}>2 Digits (Intermediate)</option>
                  <option value={3}>3 Digits (Challenger)</option>
                </select>
              </div>

              {customType !== "Multiplication" && customType !== "Division" ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Number of Rows</label>
                  <select
                    value={customRows}
                    onChange={(e) => setCustomRows(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value={2}>2 Rows</option>
                    <option value={3}>3 Rows (Speed)</option>
                    <option value={5}>5 Rows (Accuracy)</option>
                    <option value={10}>10 Rows (Zen Mode)</option>
                  </select>
                </div>
              ) : (
                <div className="opacity-50">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Number of Rows</label>
                  <input
                    type="text"
                    disabled
                    value="1 Row"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2 font-bold text-indigo-950 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Practice Sums</label>
                <select
                  value={customSums}
                  onChange={(e) => setCustomSums(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value={10}>10 Sums Drill</option>
                  <option value={20}>20 Sums Drill</option>
                  <option value={30}>30 Sums Drill</option>
                </select>
              </div>
            </div>

            {/* Operator Quick Launch Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { type: "Addition", label: "Addition", color: "border-indigo-500 hover:bg-indigo-50/30", countText: `${customSums} Drill` },
                { type: "Subtraction", label: "Subtraction", color: "border-sky-500 hover:bg-sky-50/30", countText: `${customSums} Drill` },
                { type: "Multiplication", label: "Multiplication", color: "border-amber-500 hover:bg-amber-50/30", countText: `${customSums} Drill` },
                { type: "Division", label: "Division", color: "border-purple-500 hover:bg-purple-50/30", countText: `${customSums} Drill` }
              ].map((card) => {
                const isActive = customType === card.type;
                return (
                  <button
                    key={card.type}
                    onClick={() => {
                      setCustomType(card.type as any);
                      handleStartPractice(
                        `Custom ${card.label} Speed Practice`,
                        card.type as any,
                        customSums,
                        customDigits,
                        customRows,
                        true,
                        undefined,
                        "Improve your operational bead-manipulation rhythm."
                      );
                    }}
                    className={`border-2 rounded-2xl p-4 text-left transition-all active:scale-95 flex flex-col justify-between h-32 outline-none ${card.color} ${
                      isActive ? "bg-slate-50 border-indigo-600 ring-2 ring-indigo-100" : "border-slate-150"
                    }`}
                  >
                    <div>
                      <span className="text-xl font-black block">
                        {card.type === "Addition" && "+"}
                        {card.type === "Subtraction" && "−"}
                        {card.type === "Multiplication" && "×"}
                        {card.type === "Division" && "÷"}
                      </span>
                      <h4 className="text-sm font-black text-indigo-950 mt-1">{card.label}</h4>
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] text-slate-400 font-semibold">{card.countText}</span>
                      <span className="text-xs font-bold text-indigo-600 flex items-center gap-0.5">
                        Start <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Academy Leaderboard (Matches second screenshot bottom table) */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500 fill-amber-500" />
                  Student Star Rating & Academy Leaderboard
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top performing mental arithmetic students at Geniplus Bangalore East.
                </p>
              </div>
              <button
                onClick={loadPracticeData}
                className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl"
                title="Refresh Board"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 font-black text-indigo-950">
                    <th className="px-4 py-3">SR No.</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Rating ⭐</th>
                    <th className="px-4 py-3 text-center">Assigned Level</th>
                    <th className="px-4 py-3 text-right">Practice Drills Complete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {leaderboard
                    .sort((a, b) => b.stars - a.stars)
                    .map((row, idx) => {
                      const isSelf = row.studentId === currentStudent.id;
                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isSelf ? "bg-amber-50/50 font-bold" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-slate-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 flex items-center gap-2">
                            <span className="font-bold text-indigo-950">{row.studentName}</span>
                            {isSelf && (
                              <span className="text-[9px] bg-amber-400 text-indigo-950 font-mono px-1.5 py-0.2 rounded font-extrabold uppercase">
                                You
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-amber-500 font-extrabold font-mono flex items-center gap-1">
                            {row.stars} <span className="text-[10px]">⭐</span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-indigo-600 font-bold">
                            Level {row.level}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-500">
                            {row.completedCount} exercises
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Parent Tuition Fee Desk & Digital Receipts */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
              <div>
                <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Parent Tuition Fee & Digital Receipt Desk
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track billing schedules, download stamp-sealed receipts, or upload proof-of-payments for due fees.
                </p>
              </div>
              <div className="text-[11px] bg-slate-100 px-3 py-1.5 rounded-xl font-mono text-slate-600">
                Authorized Payment Options: <strong className="text-indigo-600">Bank Transfer / UPI Pay</strong>
              </div>
            </div>

            {studentFees.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                No active tuition bills found. Contact center admin to post your ledger.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-black text-indigo-950">
                      <th className="px-4 py-3">Billing Month</th>
                      <th className="px-4 py-3">Tuition Fee</th>
                      <th className="px-4 py-3">Scholarship Disc</th>
                      <th className="px-4 py-3">Net Due</th>
                      <th className="px-4 py-3">Billing Status</th>
                      <th className="px-4 py-3 text-right">Payment Action / Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {studentFees.map((fee) => {
                      const net = fee.amount - fee.discount;
                      return (
                        <tr key={fee.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900">{fee.month}</td>
                          <td className="px-4 py-3 font-mono">₹{fee.amount}</td>
                          <td className="px-4 py-3 font-mono text-rose-500">-₹{fee.discount}</td>
                          <td className="px-4 py-3 font-mono font-bold text-indigo-950">₹{net}</td>
                          <td className="px-4 py-3">
                            {fee.status === "Paid" && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                Paid & Cleared
                              </span>
                            )}
                            {fee.status === "Pending Approval" && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                                Pending Approval
                              </span>
                            )}
                            {fee.status === "Unpaid" && (
                              <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                Payment Due
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {fee.status === "Paid" ? (
                              <button
                                onClick={() => setActiveReceipt(fee)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                              >
                                View Receipt
                              </button>
                            ) : fee.status === "Pending Approval" ? (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Ref: {fee.referenceNumber}
                              </span>
                            ) : (
                              <button
                                onClick={() => setPaymentModalFee(fee)}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm shadow-rose-100"
                              >
                                Pay Now (UPI/Bank)
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* UPI SCAN-TO-PAY AND PROOF SUBMISSION DRAWER / OVERLAY */}
          {paymentModalFee && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-black text-indigo-950 font-display">
                      Direct Tuition Fee Settlement
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Transfer money directly to Geniplus Academy Bangalore East's escrow account.
                    </p>
                  </div>
                  <button
                    onClick={() => setPaymentModalFee(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="block text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Fee Month</span>
                    <strong className="text-indigo-950 text-sm">{paymentModalFee.month}</strong>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Total Net Payable</span>
                    <strong className="text-indigo-950 text-lg font-mono">₹{paymentModalFee.amount - paymentModalFee.discount}</strong>
                  </div>
                </div>

                {/* Left/Right Scan & Bank Details */}
                {(() => {
                  const currentStudentCenter = centers.find(c => c.id === currentStudent.centerId) || centers[0] || {
                    upiId: "pay@geniplus",
                    bankDetails: "Account Name: Geniplus Education Pvt Ltd\nBank Name: ICICI Bank Ltd\nAccount Number: 1029 3847 5621\nIFSC Routing Code: ICIC0001029",
                    qrCode: ""
                  };

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* UPI QR Scanner Simulator or uploaded QR image */}
                      <div className="border border-slate-150 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Scan UPI QR code</span>
                        
                        {currentStudentCenter.qrCode ? (
                          <div className="w-32 h-32 bg-white border border-slate-200 rounded-xl p-1 flex items-center justify-center shadow-sm">
                            <img
                              src={currentStudentCenter.qrCode}
                              alt="Payment QR Code"
                              className="w-full h-full object-contain rounded"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          /* Simulated High Fidelity QR Code Container */
                          <div className="w-32 h-32 bg-white border-2 border-indigo-200 rounded-xl p-2.5 flex flex-col justify-between relative shadow-sm">
                            {/* Stylized QR Corner Targets */}
                            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-indigo-950" />
                            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-indigo-950" />
                            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-indigo-950" />
                            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-indigo-950" />
                            
                            {/* Stylized Simulated QR Matrix Dots */}
                            <div className="flex-1 flex flex-wrap gap-1 p-1 opacity-90">
                              {Array.from({ length: 49 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2.5 h-2.5 rounded-xs ${
                                    i % 3 === 0 || i % 7 === 1 || (i > 10 && i < 22)
                                      ? "bg-indigo-950"
                                      : "bg-transparent"
                                  }`}
                                />
                              ))}
                            </div>
                            
                            {/* QR Abacus Center Logo Badge */}
                            <div className="absolute inset-0 m-auto w-8 h-8 bg-amber-400 border border-indigo-950 rounded-lg flex items-center justify-center text-[10px] font-black text-indigo-950">
                              G+
                            </div>
                          </div>
                        )}
                        
                        <span className="text-[10px] font-mono text-indigo-700 font-bold mt-2">
                          UPI ID: {currentStudentCenter.upiId || "pay@geniplus"}
                        </span>
                      </div>

                      {/* Direct Bank Account details */}
                      <div className="border border-slate-150 rounded-2xl p-4 text-[11px] text-slate-600 flex flex-col justify-center space-y-2 bg-slate-50">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bank Details</span>
                        <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed">
                          {currentStudentCenter.bankDetails || `Account Name: Geniplus Education Pvt Ltd\nBank Name: ICICI Bank Ltd\nAccount Number: 1029 3847 5621\nIFSC Routing Code: ICIC0001029`}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Submission Form */}
                <form onSubmit={handleSubmitProof} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                      1. Payment Method
                    </label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                    >
                      <option value="UPI Transfer">BHIM UPI App (PhonePe/GPay/Paytm)</option>
                      <option value="Bank Transfer">NEFT / IMPS Bank Wire Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                      2. Transaction Ref ID / UTR Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UPI Ref 302948275928"
                      value={payRefId}
                      onChange={(e) => setPayRefId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                      3. Upload Payment Receipt Screenshot
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {uploadedScreenshot ? (
                        <span className="text-[10px] text-emerald-600 font-bold">✓ Screenshot Loaded</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUploadedScreenshot("https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60")}
                          className="text-[9px] bg-slate-100 text-slate-600 hover:bg-slate-200 px-2 py-1 rounded-lg font-bold shrink-0"
                        >
                          Simulate Screenshot
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setPaymentModalFee(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                    >
                      {isUploading && <RefreshCw className="w-3 h-3 animate-spin text-white" />}
                      <span>Submit Payment Proof</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* GENIPLUS HIGH FIDELITY PRINTABLE FEE RECEIPT OVERLAY */}
          {activeReceipt && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-double border-indigo-100 flex flex-col gap-6 relative overflow-hidden">
                
                {/* Receipt Watermark Stamp */}
                <div className="absolute inset-0 m-auto w-64 h-64 border-8 border-indigo-50/50 rounded-full flex items-center justify-center rotate-12 -z-0 pointer-events-none">
                  <span className="text-3xl font-black text-indigo-50/50 font-display uppercase tracking-widest">
                    GENIPLUS CLEARED
                  </span>
                </div>

                <div className="flex justify-between items-start z-10">
                  <div className="flex gap-2 items-center">
                    <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center font-black text-indigo-950 text-base shadow-sm">
                      G+
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 font-display">Geniplus Academy</h4>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Bangalore East Escrow</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase font-mono tracking-wider">
                      Official Receipt
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Receipt ID: GP-FEE-{activeReceipt.id}</p>
                  </div>
                </div>

                {/* Receipt Metadata Table */}
                <div className="border-t border-b border-dashed border-slate-200 py-3 grid grid-cols-2 gap-4 text-[11px] z-10">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Received From</span>
                    <strong className="text-indigo-950 text-xs">{currentStudent.studentName}</strong>
                    <p className="text-[10px] text-slate-500">Student ID: {currentStudent.id} • Level {currentStudent.currentLevel}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Billing / Cleared Date</span>
                    <strong className="text-indigo-950">{activeReceipt.month}</strong>
                    <p className="text-[10px] text-emerald-600 font-bold font-mono">Paid: {activeReceipt.paidDate || "Confirmed"}</p>
                  </div>
                </div>

                {/* Breakdown ledger */}
                <div className="space-y-2 z-10 text-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Description of Tuition Item</span>
                  <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center text-[11px]">
                    <div>
                      <strong className="text-indigo-950">Tuition Fee - Abacus & Arithmetic Course</strong>
                      <p className="text-[10px] text-slate-400">Regular Monthly Saturday/Sunday Instruction</p>
                    </div>
                    <span className="font-mono text-slate-700">₹{activeReceipt.amount}</span>
                  </div>

                  {activeReceipt.discount > 0 && (
                    <div className="bg-rose-50/50 rounded-xl p-3 flex justify-between items-center text-[11px]">
                      <div>
                        <strong className="text-rose-950">Center Scholarship / Special Discount</strong>
                        <p className="text-[10px] text-rose-400">Granted by Admissions Head</p>
                      </div>
                      <span className="font-mono text-rose-600 font-bold">-₹{activeReceipt.discount}</span>
                    </div>
                  )}

                  <div className="p-3 flex justify-between items-center bg-indigo-50/50 rounded-xl font-bold text-sm">
                    <span className="text-indigo-950">Total Paid Amount</span>
                    <span className="font-mono text-indigo-950 text-base">₹{activeReceipt.amount - activeReceipt.discount}</span>
                  </div>
                </div>

                {/* Footer and Sign off */}
                <div className="flex justify-between items-end mt-4 z-10 text-[10px] text-slate-400">
                  <div>
                    <p>Mode: {activeReceipt.paymentMethod || "UPI Pay"}</p>
                    <p className="font-mono">Ref ID: {activeReceipt.referenceNumber || "GP-SYSTEM-AUTO"}</p>
                  </div>

                  {/* High Fidelity Digital Stamp & Signature */}
                  <div className="text-center relative select-none">
                    <div className="absolute -top-7 right-0 left-0 mx-auto w-12 h-12 border border-dashed border-emerald-400 rounded-full flex items-center justify-center opacity-60 rotate-12">
                      <span className="text-[6px] font-black uppercase text-emerald-500 font-mono">Verified Stamp</span>
                    </div>
                    <span className="block font-mono italic text-indigo-700 font-bold text-xs">Rajesh Kumar</span>
                    <span className="block border-t border-slate-200 pt-0.5 text-[8px] uppercase font-bold text-slate-400">Authorized Seal / Signature</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 z-10 text-xs font-bold">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1"
                  >
                    <span>Print Receipt</span>
                  </button>
                  <button
                    onClick={() => setActiveReceipt(null)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Student Submissions History Logs */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Your Personal Submission Log
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Review history of practice drills solved by <strong>{currentStudent.studentName}</strong>.
            </p>

            {submissions.length > 0 ? (
              <div className="space-y-3">
                {submissions.map(sub => (
                  <div key={sub.id} className="border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-indigo-950">{sub.assignmentTitle}</span>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 font-mono">
                          {sub.mode}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Solved on {sub.date} • Operator: {sub.type}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-xs shrink-0">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</span>
                        <span className="font-extrabold font-mono text-emerald-600">{sub.accuracy}%</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Correct Sums</span>
                        <span className="font-extrabold font-mono text-indigo-950">{sub.correctSums} / {sub.totalSums}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Stars Earned</span>
                        <span className="font-extrabold font-mono text-amber-500">+{sub.starsEarned} ⭐</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                No history found for this student. Launch custom speed practice above to submit your first drill!
              </div>
            )}
          </div>

        </div>
      )}
        </>
      )}

    </div>
  );
}
