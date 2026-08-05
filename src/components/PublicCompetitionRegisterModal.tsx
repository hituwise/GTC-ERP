import React, { useState, useEffect } from "react";
import { Competition } from "../types";
import { Trophy, Sparkles, CheckCircle2, User, Phone, School, Loader2, ArrowLeft, Brain, ShieldCheck, Key, ArrowRight, Award, Flame } from "lucide-react";

interface PublicCompetitionRegisterModalProps {
  competitionId: string;
  centerId: string;
  onBackToApp: () => void;
}

export default function PublicCompetitionRegisterModal({
  competitionId,
  centerId,
  onBackToApp
}: PublicCompetitionRegisterModalProps) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  // Test mode state inside public registration
  const [testActive, setTestActive] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  // Assessment booked state
  const [assessmentBooked, setAssessmentBooked] = useState(false);

  // Form states
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [school, setSchool] = useState("");
  const [age, setAge] = useState<number>(8);

  // Sample Brain & IQ Questions for instant evaluation
  const SAMPLE_QUESTIONS = [
    {
      domain: "Concentration 🎯",
      question: "Which bead pattern equals 7 on the Soroban Abacus upper & lower deck?",
      options: ["1 Upper bead (5) + 2 Lower beads", "4 Lower beads only", "1 Upper bead only", "3 Lower beads"],
      correct: 0
    },
    {
      domain: "Memory 🧠",
      question: "Memorize: 4, 8, 2, 9. What was the 3rd number in the sequence?",
      options: ["4", "8", "2", "9"],
      correct: 2
    },
    {
      domain: "Mental Maths ➗",
      question: "Calculate mentally: 15 + 25 - 10 + 8 = ?",
      options: ["35", "38", "40", "32"],
      correct: 1
    },
    {
      domain: "Logical Thinking 🧩",
      question: "Complete the sequence: 3, 6, 12, 24, __",
      options: ["30", "36", "48", "60"],
      correct: 2
    },
    {
      domain: "General Knowledge 🌍",
      question: "Which ancient tool is known as the world's first computing device for rapid calculation?",
      options: ["Calculator", "Abacus / Soroban", "Slide Rule", "Paper Abacus"],
      correct: 1
    }
  ];

  useEffect(() => {
    const fetchCompDetails = async () => {
      try {
        const res = await fetch(`/api/erp/competitions?centerId=${encodeURIComponent(centerId)}`);
        const json = await res.json();
        if (json.success && json.competitions) {
          const comp = json.competitions.find((c: Competition) => c.id === competitionId);
          if (comp) setCompetition(comp);
        }
      } catch (e) {
        console.error("Error fetching competition details", e);
      } finally {
        setLoading(false);
      }
    };

    fetchCompDetails();
  }, [competitionId, centerId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !parentMobile) {
      alert("Please provide Student Name and Parent Mobile Number.");
      return;
    }

    setRegistering(true);
    try {
      const res = await fetch("/api/erp/competitions/register-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId,
          studentName,
          parentName,
          parentMobile,
          parentEmail,
          school,
          age
        })
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(true);
        if (json.loginCredentials) {
          setCredentials(json.loginCredentials);
        }
      } else {
        alert(json.error || "Registration failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting registration.");
    } finally {
      setRegistering(false);
    }
  };

  const handleAnswerSelect = (optionIdx: number) => {
    const updated = [...answers];
    updated[currentQIndex] = optionIdx;
    setAnswers(updated);

    if (currentQIndex < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      setTestSubmitted(true);
    }
  };

  // Calculate skill score breakdown
  const calculateSkillBreakdown = () => {
    let concentration = answers[0] === SAMPLE_QUESTIONS[0].correct ? 90 : 60;
    let memory = answers[1] === SAMPLE_QUESTIONS[1].correct ? 85 : 55;
    let maths = answers[2] === SAMPLE_QUESTIONS[2].correct ? 95 : 65;
    let logic = answers[3] === SAMPLE_QUESTIONS[3].correct ? 90 : 60;
    let gk = answers[4] === SAMPLE_QUESTIONS[4].correct ? 80 : 50;

    const correctCount = answers.filter((a, idx) => a === SAMPLE_QUESTIONS[idx].correct).length;
    const overallScore = Math.round((correctCount / SAMPLE_QUESTIONS.length) * 100);

    return { concentration, memory, maths, logic, gk, overallScore, correctCount };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative font-sans">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Back Button */}
        <button
          onClick={onBackToApp}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all cursor-pointer font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal Login
        </button>

        {loading ? (
          <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 font-bold">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            Loading Competition Portal...
          </div>
        ) : success ? (
          <div className="space-y-6">
            {/* Account Confirmation Banner */}
            <div className="bg-emerald-950/80 border border-emerald-800/80 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30 text-2xl">
                🎉
              </div>
              <div>
                <h2 className="text-xl font-black font-display text-white">
                  Registration & Student Dashboard Account Created!
                </h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                  Welcome <strong className="text-amber-400">{studentName}</strong>! Your competition registration is confirmed and linked to your student dashboard.
                </p>
              </div>

              {credentials && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs space-y-1 text-left max-w-xs mx-auto">
                  <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <span>Student Dashboard Credentials</span>
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="font-mono font-bold text-white">
                    Username: <span className="text-amber-400">{credentials.username}</span>
                  </div>
                  <div className="font-mono font-bold text-white">
                    Password: <span className="text-amber-400">{credentials.password}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Test Launcher OR Results */}
            {!testActive && !testSubmitted ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-indigo-500/30">
                  🧠
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-display">
                    Take the Online Brain & IQ Challenge
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    Evaluate Concentration, Memory, Mental Maths, Logic & GK in 3 minutes.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setTestActive(true)}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Start Brain & IQ Challenge Test 🚀</span>
                  </button>

                  <button
                    type="button"
                    onClick={onBackToApp}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Go to Login Portal
                  </button>
                </div>
              </div>
            ) : testActive && !testSubmitted ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono font-bold text-amber-400">
                    Question {currentQIndex + 1} of {SAMPLE_QUESTIONS.length}
                  </span>
                  <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    {SAMPLE_QUESTIONS[currentQIndex].domain}
                  </span>
                </div>

                <h4 className="text-sm font-black text-white font-display leading-relaxed">
                  {SAMPLE_QUESTIONS[currentQIndex].question}
                </h4>

                <div className="space-y-2">
                  {SAMPLE_QUESTIONS[currentQIndex].options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleAnswerSelect(oIdx)}
                      className="w-full text-left p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-indigo-950 hover:border-indigo-600 text-xs font-bold transition-all cursor-pointer flex items-center justify-between"
                    >
                      <span>{opt}</span>
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* RESULT BREAKDOWN CARD */
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                {(() => {
                  const bd = calculateSkillBreakdown();
                  return (
                    <>
                      <div className="text-center space-y-2">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest font-mono">
                          Evaluation Report Generated
                        </span>
                        <h3 className="text-2xl font-black text-white font-display">
                          {studentName}'s Brain Skill Results
                        </h3>
                        <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-4 py-1.5 rounded-full text-xs font-black border border-amber-500/40 font-mono">
                          <Award className="w-4 h-4" />
                          Overall Accuracy Score: {bd.overallScore}% ({bd.correctCount}/{SAMPLE_QUESTIONS.length} Correct)
                        </div>
                      </div>

                      {/* Skill Breakdown Metrics */}
                      <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
                        <div>
                          <div className="flex justify-between font-bold mb-1">
                            <span className="text-slate-300">🎯 Concentration</span>
                            <span className="text-amber-400 font-mono">{bd.concentration}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${bd.concentration}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-bold mb-1">
                            <span className="text-slate-300">🧠 Memory & Recall</span>
                            <span className="text-indigo-400 font-mono">{bd.memory}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${bd.memory}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-bold mb-1">
                            <span className="text-slate-300">➗ Mental Calculation</span>
                            <span className="text-emerald-400 font-mono">{bd.maths}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${bd.maths}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-bold mb-1">
                            <span className="text-slate-300">🧩 Logical Thinking</span>
                            <span className="text-purple-400 font-mono">{bd.logic}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${bd.logic}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Direct Lead Conversion CTA */}
                      <div className="bg-gradient-to-r from-indigo-900 to-amber-950 p-5 rounded-2xl border border-indigo-700/50 text-center space-y-3">
                        <h4 className="text-sm font-black text-white font-display">
                          🎉 Great Performance!
                        </h4>
                        <p className="text-xs text-indigo-200 leading-relaxed max-w-md mx-auto">
                          Want to discover how <strong className="text-amber-300">{studentName}</strong> can double calculation speed, concentration and 3D bead visualization?
                        </p>

                        {assessmentBooked ? (
                          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-black flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Free Abacus Assessment & Trial Session Requested! Our team will contact you.</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAssessmentBooked(true)}
                            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 inline-flex items-center gap-2"
                          >
                            <span>Book Free Abacus Assessment & Trial Session 🚀</span>
                          </button>
                        )}
                      </div>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={onBackToApp}
                          className="text-xs text-slate-400 hover:text-white font-bold underline cursor-pointer"
                        >
                          Log in to Student Dashboard Account
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Title */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" />
                Extra-Curricular Competition Registration
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
                {competition?.title || "National Brain & IQ Skill Cup 2026"}
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {competition?.description || "Open to all students & guest participants. Evaluates Concentration, Memory, Calculation & Logic!"}
              </p>
            </div>

            {/* Event Info Bar */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Event Date</span>
                <span className="font-bold text-amber-400 font-mono">{competition?.eventDate || "Upcoming"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Entry Fee</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {competition?.entryFee === 0 || !competition?.entryFee ? "FREE REGISTRATION" : `₹${competition.entryFee}`}
                </span>
              </div>
            </div>

            {/* Guest Registration Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Student Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Neil Sharma"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Parent Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rakesh Sharma"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Parent Mobile Number (WhatsApp) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={parentMobile}
                      onChange={(e) => setParentMobile(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">School Name</label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. St. Xavier's School"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Student Age</label>
                  <input
                    type="number"
                    min={4}
                    max={18}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={registering}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                Confirm & Create Student Dashboard Account
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
