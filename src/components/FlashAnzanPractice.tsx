import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Volume2, VolumeX, CheckCircle2, XCircle, ArrowLeft, Sparkles, HelpCircle, Eye, Sliders, Trophy, Zap, Award } from "lucide-react";

interface FlashAnzanPracticeProps {
  onBack?: () => void;
  studentName?: string;
  studentId?: string;
  onFinishExercise?: (stats: { correctCount: number; totalCount: number; starsEarned: number }) => void;
}

export default function FlashAnzanPractice({
  onBack,
  studentName,
  studentId,
  onFinishExercise
}: FlashAnzanPracticeProps) {
  // Configuration States
  const [digits, setDigits] = useState<number>(1); // 1 to 5
  const [duration, setDuration] = useState<number>(1.0); // 0.1s to 5.0s
  const [problemNumbers, setProblemNumbers] = useState<number>(3); // 2 to 50 terms
  const [allowSubtraction, setAllowSubtraction] = useState<boolean>(true); // Addition & Subtraction vs Addition Only
  const [answerMode, setAnswerMode] = useState<"write" | "click">("write");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [totalProblemsToPlay, setTotalProblemsToPlay] = useState<number>(5);

  // Exercise Running States
  const [stage, setStage] = useState<"config" | "countdown" | "flashing" | "answering" | "result" | "summary">("config");
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);
  const [currentProblemNumbers, setCurrentProblemNumbers] = useState<number[]>([]);
  const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState<number>(0);
  
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [flashingIndex, setFlashingIndex] = useState<number>(-1);
  const [userAnswerInput, setUserAnswerInput] = useState<string>("");
  
  // Results Tracking
  const [userAnswersHistory, setUserAnswersHistory] = useState<{
    problemIndex: number;
    numbers: number[];
    correctAnswer: number;
    userAnswer: number | null;
    isCorrect: boolean;
  }[]>([]);
  const [showRevealedAnswer, setShowRevealedAnswer] = useState<boolean>(false);
  const [feedbackState, setFeedbackState] = useState<"correct" | "incorrect" | null>(null);

  // Web Audio Context for Beeps
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playBeep = (freq = 880, durationMs = 80, type: OscillatorType = "sine") => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      console.warn("Audio beep warning:", e);
    }
  };

  const playSuccessChime = () => {
    if (!soundEnabled) return;
    playBeep(523.25, 100); // C5
    setTimeout(() => playBeep(659.25, 100), 100); // E5
    setTimeout(() => playBeep(783.99, 200), 200); // G5
  };

  const playErrorChime = () => {
    if (!soundEnabled) return;
    playBeep(220, 150, "sawtooth");
    setTimeout(() => playBeep(180, 250, "sawtooth"), 150);
  };

  // Generate a problem array based on settings
  const generateProblem = () => {
    const minVal = Math.pow(10, digits - 1);
    const maxVal = Math.pow(10, digits) - 1;

    const nums: number[] = [];
    let runningSum = 0;

    for (let i = 0; i < problemNumbers; i++) {
      let num = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;

      // Decide if subtraction is allowed for terms after the 1st
      if (allowSubtraction && i > 0) {
        const canSubtract = Math.random() < 0.45 && runningSum >= num;
        if (canSubtract) {
          num = -num;
        }
      }

      nums.push(num);
      runningSum += num;
    }

    return { numbers: nums, correctAnswer: runningSum };
  };

  // Start the entire session
  const handleStartSession = () => {
    setUserAnswersHistory([]);
    setCurrentProblemIndex(0);
    startProblem(0);
  };

  // Start an individual problem
  const startProblem = (pIndex: number) => {
    const prob = generateProblem();
    setCurrentProblemNumbers(prob.numbers);
    setCurrentCorrectAnswer(prob.correctAnswer);
    setUserAnswerInput("");
    setFeedbackState(null);
    setShowRevealedAnswer(false);
    setFlashingIndex(-1);

    // Start Countdown
    setStage("countdown");
    setCountdownValue(3);
    playBeep(440, 100);
  };

  // Countdown effect
  useEffect(() => {
    if (stage !== "countdown") return;
    if (countdownValue > 1) {
      const timer = setTimeout(() => {
        setCountdownValue(prev => prev - 1);
        playBeep(440, 100);
      }, 800);
      return () => clearTimeout(timer);
    } else if (countdownValue === 1) {
      const timer = setTimeout(() => {
        setCountdownValue(0);
        playBeep(880, 150);
        setStage("flashing");
        setFlashingIndex(0);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [stage, countdownValue]);

  // Flashing numbers sequence effect
  useEffect(() => {
    if (stage !== "flashing") return;

    if (flashingIndex >= 0 && flashingIndex < currentProblemNumbers.length) {
      playBeep(920, 70);
      const timer = setTimeout(() => {
        setFlashingIndex(prev => prev + 1);
      }, Math.max(100, duration * 1000));
      return () => clearTimeout(timer);
    } else if (flashingIndex >= currentProblemNumbers.length) {
      // Finished flashing all numbers
      setStage("answering");
      playBeep(600, 120);
    }
  }, [stage, flashingIndex, duration, currentProblemNumbers]);

  // Handle user answer submission
  const handleSubmitAnswer = (submittedVal?: number) => {
    const val = submittedVal !== undefined ? submittedVal : parseFloat(userAnswerInput);
    if (isNaN(val)) return;

    const isCorrect = val === currentCorrectAnswer;
    setFeedbackState(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      playSuccessChime();
    } else {
      playErrorChime();
    }

    const historyItem = {
      problemIndex: currentProblemIndex,
      numbers: currentProblemNumbers,
      correctAnswer: currentCorrectAnswer,
      userAnswer: val,
      isCorrect
    };

    const updatedHistory = [...userAnswersHistory, historyItem];
    setUserAnswersHistory(updatedHistory);
    setStage("result");
  };

  // Calculate summary stats
  const totalCorrect = userAnswersHistory.filter(h => h.isCorrect).length;
  const accuracyPct = userAnswersHistory.length > 0 ? Math.round((totalCorrect / userAnswersHistory.length) * 100) : 0;
  // Stars are ONLY awarded if student writes their answer (not if answer is revealed by click)
  const starsEarned = answerMode === "write" ? totalCorrect * 3 : 0;

  const handleNextProblem = async () => {
    if (currentProblemIndex + 1 < totalProblemsToPlay) {
      const nextIdx = currentProblemIndex + 1;
      setCurrentProblemIndex(nextIdx);
      startProblem(nextIdx);
    } else {
      // Session finished
      setStage("summary");

      // Post score to practice submit API if studentId is provided
      if (studentId) {
        try {
          await fetch("/api/erp/practice-submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId,
              studentName,
              assignmentTitle: `Flash Anzan Gym (${digits}D, ${duration}s, ${problemNumbers}R - ${answerMode === "write" ? "Write Mode" : "Show Answer Mode"})`,
              type: allowSubtraction ? "Addition & Subtraction" : "Addition",
              totalSums: totalProblemsToPlay,
              correctSums: totalCorrect,
              wrongSums: Math.max(0, totalProblemsToPlay - totalCorrect),
              accuracy: accuracyPct,
              starsEarned,
              mode: "flash_anzan",
              digits,
              rows: problemNumbers
            })
          });
        } catch (err) {
          console.error("Failed recording Flash Anzan score:", err);
        }
      }

      if (onFinishExercise) {
        onFinishExercise({
          correctCount: totalCorrect,
          totalCount: totalProblemsToPlay,
          starsEarned
        });
      }
    }
  };

  // Helper component to render mathematically accurate sliders with matched filled bars and tick positions
  const renderAccurateSlider = (
    min: number,
    max: number,
    step: number,
    value: number,
    onChange: (val: number) => void,
    ticks: { val: number; label: string }[]
  ) => {
    const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

    return (
      <div className="relative pt-2 pb-6">
        {/* Slider track background and fill */}
        <div className="relative w-full h-3 bg-slate-900/40 rounded-full border border-white/20 overflow-hidden pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-75 shadow-sm"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Actual Range Input overlaid */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute top-2 left-0 w-full h-3 bg-transparent appearance-none cursor-pointer focus:outline-none z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-amber-400
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(251,191,36,0.8)]
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-amber-400
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(251,191,36,0.8)]
            [&::-moz-range-thumb]:cursor-pointer"
        />

        {/* Tick Marks & Labels positioned at accurate percentages */}
        <div className="relative w-full h-4 mt-2">
          {ticks.map((t, idx) => {
            const tickPct = Math.max(0, Math.min(100, ((t.val - min) / (max - min)) * 100));
            const isSelected = Math.abs(value - t.val) < (step * 0.51);

            return (
              <div
                key={idx}
                className="absolute top-0 flex flex-col items-center"
                style={{
                  left: `${tickPct}%`,
                  transform: tickPct === 0 ? "none" : tickPct === 100 ? "translateX(-100%)" : "translateX(-50%)"
                }}
              >
                <div className={`w-1 h-1.5 rounded-full mb-0.5 ${isSelected ? "bg-amber-300" : "bg-white/40"}`} />
                <span className={`text-[11px] font-extrabold whitespace-nowrap transition-colors ${isSelected ? "text-amber-300 scale-105" : "text-sky-100/80"}`}>
                  {t.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-black text-indigo-950 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
              Flash Anzan Rapid Speed Gym
            </h2>
            <p className="text-xs text-slate-500">
              High-speed mental arithmetic visualization for Abacus & Soroban
            </p>
          </div>
        </div>

        {stage !== "config" && (
          <button
            onClick={() => setStage("config")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all"
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Settings</span>
          </button>
        )}
      </div>

      {/* ================= STAGE 1: CONFIGURATION ================= */}
      {stage === "config" && (
        <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
          {/* Decorative background effects */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            {/* Header badge */}
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                Customize Flash Parameters
              </span>
              <h3 className="text-2xl font-black font-display tracking-tight">
                Flash Anzan Setup
              </h3>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-6 shadow-inner">
              {/* 1. Digits Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm font-bold">
                  <label className="flex items-center gap-2">
                    <span>Digits:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={digits}
                      onChange={(e) => setDigits(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                      className="w-16 px-2 py-1 bg-white text-slate-900 font-extrabold text-center rounded-lg shadow-sm border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    <span className="text-xs text-sky-100">Digit(s)</span>
                  </div>
                </div>
                {renderAccurateSlider(
                  1,
                  5,
                  1,
                  digits,
                  (val) => setDigits(val),
                  [
                    { val: 1, label: "1" },
                    { val: 2, label: "2" },
                    { val: 3, label: "3" },
                    { val: 4, label: "4" },
                    { val: 5, label: "5" }
                  ]
                )}
              </div>

              {/* 2. Duration Slider (in seconds) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm font-bold">
                  <label className="flex items-center gap-2">
                    <span>Duration (in seconds per number):</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={0.1}
                      min={0.1}
                      max={5.0}
                      value={duration}
                      onChange={(e) => setDuration(Math.max(0.1, Math.min(5.0, parseFloat(e.target.value) || 0.5)))}
                      className="w-20 px-2 py-1 bg-white text-slate-900 font-extrabold text-center rounded-lg shadow-sm border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    <span className="text-xs text-sky-100">sec</span>
                  </div>
                </div>
                {renderAccurateSlider(
                  0.1,
                  5.0,
                  0.1,
                  duration,
                  (val) => setDuration(Math.round(val * 10) / 10),
                  [
                    { val: 0.1, label: "0.1 (Fast)" },
                    { val: 1.0, label: "1.0 (Normal)" },
                    { val: 2.5, label: "2.5" },
                    { val: 5.0, label: "5.0 (Slow)" }
                  ]
                )}
              </div>

              {/* 3. Problem Numbers (Terms/Rows per problem) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm font-bold">
                  <label className="flex items-center gap-2">
                    <span>Problem Numbers (Rows count):</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={2}
                      max={50}
                      value={problemNumbers}
                      onChange={(e) => setProblemNumbers(Math.max(2, Math.min(50, parseInt(e.target.value) || 2)))}
                      className="w-16 px-2 py-1 bg-white text-slate-900 font-extrabold text-center rounded-lg shadow-sm border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    <span className="text-xs text-sky-100">Rows</span>
                  </div>
                </div>
                {renderAccurateSlider(
                  2,
                  50,
                  1,
                  problemNumbers,
                  (val) => setProblemNumbers(val),
                  [
                    { val: 2, label: "2" },
                    { val: 5, label: "5" },
                    { val: 10, label: "10" },
                    { val: 25, label: "25" },
                    { val: 50, label: "50" }
                  ]
                )}
              </div>

              {/* 4. Operation Mode: Addition Only vs Subtraction & Addition */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-sky-100">
                  Select Operation Mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAllowSubtraction(false)}
                    className={`p-3 rounded-xl border text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                      !allowSubtraction
                        ? "bg-white text-sky-950 border-white shadow-lg ring-2 ring-amber-400"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    }`}
                  >
                    <div>
                      <span className="block text-sm">Only Addition (+)</span>
                      <span className="text-[10px] opacity-80 font-normal">Positive numbers only</span>
                    </div>
                    {!allowSubtraction && <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAllowSubtraction(true)}
                    className={`p-3 rounded-xl border text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                      allowSubtraction
                        ? "bg-white text-sky-950 border-white shadow-lg ring-2 ring-amber-400"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    }`}
                  >
                    <div>
                      <span className="block text-sm">Addition & Subtraction (+ / -)</span>
                      <span className="text-[10px] opacity-80 font-normal font-semibold">Includes negative terms</span>
                    </div>
                    {allowSubtraction && <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />}
                  </button>
                </div>
              </div>

              {/* 5. Answer Mode & Sound Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                {/* Answer mode box (matches screenshot radios) */}
                <div className="bg-white/10 border border-white/20 rounded-xl p-3 space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-sky-100 mb-1">
                    Answer Option:
                  </label>
                  <label className="flex items-center justify-between text-xs font-bold cursor-pointer p-1.5 rounded-lg hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="answerMode"
                        checked={answerMode === "click"}
                        onChange={() => setAnswerMode("click")}
                        className="w-4 h-4 accent-amber-400 cursor-pointer"
                      />
                      <span>Show correct answer by click</span>
                    </div>
                    <span className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-full font-mono">0 Stars</span>
                  </label>
                  <label className="flex items-center justify-between text-xs font-bold cursor-pointer p-1.5 rounded-lg hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="answerMode"
                        checked={answerMode === "write"}
                        onChange={() => setAnswerMode("write")}
                        className="w-4 h-4 accent-amber-400 cursor-pointer"
                      />
                      <span>Write your answer</span>
                    </div>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full font-mono">Earn Stars ⭐</span>
                  </label>
                </div>

                {/* Sound & Total problems option */}
                <div className="bg-white/10 border border-white/20 rounded-xl p-3 space-y-3 flex flex-col justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4 text-slate-300" />}
                      Sound is On
                    </span>
                  </label>

                  <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-white/10">
                    <span>Session Length:</span>
                    <select
                      value={totalProblemsToPlay}
                      onChange={(e) => setTotalProblemsToPlay(parseInt(e.target.value))}
                      className="bg-white text-slate-900 font-extrabold px-2 py-1 rounded-lg text-xs"
                    >
                      <option value={3}>3 Problems</option>
                      <option value={5}>5 Problems</option>
                      <option value={10}>10 Problems</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Big START Button matching screenshot */}
            <div className="text-center pt-2">
              <button
                onClick={handleStartSession}
                className="w-full sm:w-64 py-4 bg-white hover:bg-amber-300 text-sky-950 font-black text-xl tracking-wider uppercase rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3 mx-auto border-2 border-white"
              >
                <Play className="w-6 h-6 text-sky-950 fill-sky-950" />
                <span>START</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STAGE 2: COUNTDOWN ================= */}
      {stage === "countdown" && (
        <div className="bg-slate-950 rounded-3xl p-12 sm:p-20 text-center text-white shadow-2xl border-4 border-indigo-600 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
          <div className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">
            Problem #{currentProblemIndex + 1} of {totalProblemsToPlay} • Get Ready!
          </div>
          <div className="text-8xl sm:text-9xl font-black font-mono text-amber-400 animate-bounce">
            {countdownValue}
          </div>
          <div className="text-sm font-bold text-slate-400 mt-6">
            Focus your eyes on the center of the screen
          </div>
        </div>
      )}

      {/* ================= STAGE 3: FLASHING NUMBERS ================= */}
      {stage === "flashing" && (
        <div className="bg-slate-950 rounded-3xl p-8 sm:p-16 text-center text-white shadow-2xl border-4 border-sky-500 flex flex-col items-center justify-center min-h-[420px] relative">
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center text-xs font-bold text-slate-400">
            <span>Problem #{currentProblemIndex + 1} of {totalProblemsToPlay}</span>
            <span>Speed: {duration}s per number</span>
            <span>Progress: {flashingIndex + 1} / {currentProblemNumbers.length}</span>
          </div>

          <div className="w-full my-auto flex items-center justify-center">
            {flashingIndex >= 0 && flashingIndex < currentProblemNumbers.length && (
              <div
                key={flashingIndex}
                className={`text-7xl sm:text-9xl font-black font-mono tracking-tight transition-all transform scale-100 animate-pulse ${
                  currentProblemNumbers[flashingIndex] < 0
                    ? "text-rose-400 drop-shadow-[0_0_25px_rgba(244,63,94,0.6)]"
                    : "text-amber-300 drop-shadow-[0_0_25px_rgba(252,211,77,0.6)]"
                }`}
              >
                {currentProblemNumbers[flashingIndex] > 0
                  ? `+${currentProblemNumbers[flashingIndex]}`
                  : currentProblemNumbers[flashingIndex]}
              </div>
            )}
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-8 max-w-md">
            <div
              className="bg-amber-400 h-full transition-all duration-150"
              style={{
                width: `${((flashingIndex + 1) / currentProblemNumbers.length) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* ================= STAGE 4: ANSWERING ================= */}
      {stage === "answering" && (
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl border-2 border-indigo-500 min-h-[420px] flex flex-col items-center justify-center space-y-6">
          <div className="text-xs font-black uppercase tracking-widest text-indigo-400">
            Problem #{currentProblemIndex + 1} Complete!
          </div>

          <h3 className="text-2xl font-black font-display text-white">
            What is the total sum?
          </h3>

          {answerMode === "write" ? (
            <div className="w-full max-w-sm space-y-4">
              <input
                type="number"
                autoFocus
                value={userAnswerInput}
                onChange={(e) => setUserAnswerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitAnswer();
                }}
                placeholder="Enter calculated total..."
                className="w-full text-center text-4xl font-mono font-black py-4 px-6 rounded-2xl bg-slate-800 text-amber-300 border-2 border-slate-700 focus:border-amber-400 focus:outline-none shadow-inner"
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setFlashingIndex(0);
                    setStage("flashing");
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-sky-400" />
                  <span>Replay Flash ⚡</span>
                </button>

                <button
                  onClick={() => handleSubmitAnswer()}
                  disabled={!userAnswerInput.trim()}
                  className="py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Answer</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md space-y-4">
              {!showRevealedAnswer ? (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setFlashingIndex(0);
                      setStage("flashing");
                    }}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-sm rounded-xl border border-sky-500/30 shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-4 h-4 text-sky-400" />
                    <span>Replay Flash ⚡</span>
                  </button>

                  <button
                    onClick={() => setShowRevealedAnswer(true)}
                    className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <Eye className="w-5 h-5" />
                    <span>Show Correct Answer</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4 animate-scale-up">
                  <div className="text-xs text-slate-400">Correct Calculated Sum:</div>
                  <div className="text-5xl font-mono font-black text-amber-400">
                    {currentCorrectAnswer}
                  </div>
                  <div className="text-xs text-slate-300 font-mono bg-slate-950/50 p-3 rounded-xl">
                    Sequence: {currentProblemNumbers.map(n => n > 0 ? `+${n}` : `${n}`).join(" ")}
                  </div>
                  <button
                    onClick={() => handleSubmitAnswer(currentCorrectAnswer)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl cursor-pointer"
                  >
                    Continue to Next Problem →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= STAGE 5: RESULT FOR ONE PROBLEM ================= */}
      {stage === "result" && (
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl border-2 border-indigo-500 min-h-[420px] flex flex-col items-center justify-center space-y-6">
          {feedbackState === "correct" ? (
            <div className="space-y-4 animate-scale-up">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-emerald-400">Spot On! Correct!</h3>
              <p className="text-sm text-slate-300">
                {answerMode === "write" ? (
                  <>You earned <strong className="text-amber-300">+3 Stars ⭐</strong> for this mental speed calculation.</>
                ) : (
                  <span className="text-amber-200 block">Correct sum verified! 💡 <span className="text-slate-400 text-xs block mt-1">(Stars are earned when using "Write your answer" mode)</span></span>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-scale-up">
              <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border-2 border-rose-500">
                <XCircle className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-rose-400">Incorrect Answer</h3>
              <p className="text-sm text-slate-300">
                Your Answer: <span className="font-mono text-rose-300">{userAnswerInput}</span> | Correct Sum: <strong className="font-mono text-amber-400">{currentCorrectAnswer}</strong>
              </p>
            </div>
          )}

          {/* Step-by-step breakdown */}
          <div className="bg-slate-950/80 rounded-2xl p-4 max-w-md w-full text-xs font-mono text-slate-300 border border-slate-800">
            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Flashed Sequence:</span>
            <div className="flex flex-wrap gap-2 justify-center">
              {currentProblemNumbers.map((num, i) => (
                <span key={i} className={`px-2 py-1 rounded bg-slate-900 ${num < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {num > 0 ? `+${num}` : num}
                </span>
              ))}
              <span className="text-amber-400 font-bold">= {currentCorrectAnswer}</span>
            </div>
          </div>

          <button
            onClick={handleNextProblem}
            className="w-full max-w-xs py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base rounded-2xl shadow-xl transition-all cursor-pointer"
          >
            {currentProblemIndex + 1 < totalProblemsToPlay ? "Next Problem →" : "View Final Session Results 🎉"}
          </button>
        </div>
      )}

      {/* ================= STAGE 6: FINAL SESSION SUMMARY ================= */}
      {stage === "summary" && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl border-2 border-indigo-500/50 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-400/20 text-amber-300 rounded-full flex items-center justify-center mx-auto border-2 border-amber-400">
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-3xl font-black font-display text-white">
              Flash Anzan Gym Completed!
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Awesome speed practice! Here is your mental accuracy summary:
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <span className="block text-[10px] uppercase font-black text-slate-400">Accuracy</span>
              <span className="text-2xl font-black text-amber-300">{accuracyPct}%</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <span className="block text-[10px] uppercase font-black text-slate-400">Score</span>
              <span className="text-2xl font-black text-emerald-400">{totalCorrect} / {userAnswersHistory.length}</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <span className="block text-[10px] uppercase font-black text-slate-400">Stars Earned</span>
              <span className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                {starsEarned} <span className="text-sm">⭐</span>
              </span>
              {answerMode === "click" && (
                <span className="block text-[9px] text-amber-200/80 font-medium mt-1">
                  Write mode required
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <button
              onClick={handleStartSession}
              className="flex-1 py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again</span>
            </button>
            <button
              onClick={() => setStage("config")}
              className="flex-1 py-3.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border border-white/20"
            >
              <Sliders className="w-4 h-4" />
              <span>Change Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
