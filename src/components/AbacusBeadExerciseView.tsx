import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Trophy, 
  Target, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Flame, 
  Star, 
  Clock, 
  Play, 
  Pause, 
  Settings2,
  Award,
  Zap,
  Eye,
  Grid
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AbacusBeadExerciseProps {
  studentId?: string;
  studentName?: string;
  onFinishExercise?: (stats: {
    total: number;
    correct: number;
    stars: number;
    mode: string;
  }) => void;
  className?: string;
}

type ExerciseMode = "SET_BEADS" | "READ_BEADS" | "FLASHCARDS";

// Sound Chime Helper using Web Audio API
const playSound = (type: "correct" | "wrong" | "click" | "clear", soundEnabled: boolean = true) => {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "correct") {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc1.frequency.setValueAtTime(1046.50, now + 0.3); // C6

      osc2.frequency.setValueAtTime(523.25 * 1.005, now);
      osc2.frequency.setValueAtTime(659.25 * 1.005, now + 0.1);
      osc2.frequency.setValueAtTime(783.99 * 1.005, now + 0.2);
      osc2.frequency.setValueAtTime(1046.50 * 1.005, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } else if (type === "wrong") {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.setValueAtTime(180, now + 0.15); // Low note

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === "click") {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "clear") {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {
    // Ignore audio errors
  }
};

export default function AbacusBeadExerciseView({
  studentId,
  studentName = "Abacus Scholar",
  onFinishExercise,
  className = ""
}: AbacusBeadExerciseProps) {
  // Exercise Settings
  const [exerciseMode, setExerciseMode] = useState<ExerciseMode>("SET_BEADS");
  const [digitsCount, setDigitsCount] = useState<number>(2); // 1, 2, 3, or 4 digits
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [flashcardSeconds, setFlashcardSeconds] = useState<number>(0); // 0 = manual, 3 = 3s, 5 = 5s, 10 = 10s

  // State for current Rods configuration:
  // Rod 0 = Units (1s), Rod 1 = Tens (10s), Rod 2 = Hundreds (100s), Rod 3 = Thousands (1000s)
  // upperBeads[rodIdx] = 0 (up/inactive) or 1 (down/active, adds 5)
  // lowerBeads[rodIdx] = 0..4 (number of lower beads moved up/active towards beam)
  const [upperBeads, setUpperBeads] = useState<number[]>([0, 0, 0, 0]);
  const [lowerBeads, setLowerBeads] = useState<number[]>([0, 0, 0, 0]);

  // Game/Question State
  const [targetNumber, setTargetNumber] = useState<number>(37);
  const [userReadAnswer, setUserReadAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<{
    status: "idle" | "correct" | "wrong";
    message: string;
  }>({ status: "idle", message: "" });

  // Progress metrics
  const [score, setScore] = useState<number>(0);
  const [totalAttempted, setTotalAttempted] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [earnedStars, setEarnedStars] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [isSavingProgress, setIsSavingProgress] = useState<boolean>(false);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);
  const [flashcardTimerLeft, setFlashcardTimerLeft] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate current numeric value represented by the Abacus beads
  const calculateAbacusValue = (upper: number[], lower: number[]): number => {
    let val = 0;
    for (let rod = 0; rod < digitsCount; rod++) {
      const rodUpper = upper[rod] || 0;
      const rodLower = lower[rod] || 0;
      const rodDigit = (rodUpper * 5) + rodLower;
      val += rodDigit * Math.pow(10, rod);
    }
    return val;
  };

  const currentAbacusValue = calculateAbacusValue(upperBeads, lowerBeads);

  // Generate a new random target number based on digitsCount
  const generateRandomTarget = (digits: number): number => {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    if (digits === 1) return Math.floor(Math.random() * 9) + 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Convert a number into upper & lower bead states
  const numberToBeadState = (num: number, digits: number) => {
    const u = [0, 0, 0, 0];
    const l = [0, 0, 0, 0];
    for (let rod = 0; rod < digits; rod++) {
      const digit = Math.floor(num / Math.pow(10, rod)) % 10;
      if (digit >= 5) {
        u[rod] = 1; // upper bead down
        l[rod] = digit - 5;
      } else {
        u[rod] = 0;
        l[rod] = digit;
      }
    }
    return { upper: u, lower: l };
  };

  // Start next round/question
  const startNextQuestion = (overrideMode?: ExerciseMode, overrideDigits?: number) => {
    const mode = overrideMode || exerciseMode;
    const digits = overrideDigits || digitsCount;

    // Reset abacus beads
    setUpperBeads([0, 0, 0, 0]);
    setLowerBeads([0, 0, 0, 0]);
    setUserReadAnswer("");
    setFeedback({ status: "idle", message: "" });
    setShowCelebration(false);

    const nextTarget = generateRandomTarget(digits);
    setTargetNumber(nextTarget);

    if (mode === "READ_BEADS" || mode === "FLASHCARDS") {
      // Set the abacus to display the target number for the kid to read
      const beadState = numberToBeadState(nextTarget, digits);
      setUpperBeads(beadState.upper);
      setLowerBeads(beadState.lower);
    }

    if (mode === "FLASHCARDS" && flashcardSeconds > 0) {
      setFlashcardTimerLeft(flashcardSeconds);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Session ID for live progress syncing
  const gymSessionIdRef = useRef<string>(`SESSION_GYM_${studentId || 'anon'}_${Date.now()}`);

  // On mount or mode/digits change
  useEffect(() => {
    gymSessionIdRef.current = `SESSION_GYM_${studentId || 'anon'}_${Date.now()}`;
    setScore(0);
    setTotalAttempted(0);
    setStreak(0);
    setEarnedStars(0);
    setElapsedSeconds(0);
    startNextQuestion();
  }, [exerciseMode, digitsCount]);

  // Overall session timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive]);

  // Flashcard Countdown timer
  useEffect(() => {
    let timer: any = null;
    if (exerciseMode === "FLASHCARDS" && flashcardSeconds > 0 && flashcardTimerLeft > 0) {
      timer = setInterval(() => {
        setFlashcardTimerLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [exerciseMode, flashcardSeconds, flashcardTimerLeft]);

  // Handle clicking an upper deck bead (value 5)
  const handleToggleUpperBead = (rodIdx: number) => {
    playSound("click", soundEnabled);
    setUpperBeads(prev => {
      const updated = [...prev];
      updated[rodIdx] = updated[rodIdx] === 1 ? 0 : 1;
      return updated;
    });
  };

  // Handle clicking lower deck beads (value 1 each, 0 to 4)
  const handleToggleLowerBead = (rodIdx: number, beadIdx: number) => {
    playSound("click", soundEnabled);
    setLowerBeads(prev => {
      const updated = [...prev];
      const currentActive = updated[rodIdx] || 0;
      const targetCount = beadIdx + 1;
      
      // If clicking already active bead, deactivate down to that level
      if (currentActive === targetCount) {
        updated[rodIdx] = beadIdx;
      } else {
        updated[rodIdx] = targetCount;
      }
      return updated;
    });
  };

  // Clear all beads on the Abacus
  const handleClearAbacus = () => {
    playSound("clear", soundEnabled);
    setUpperBeads([0, 0, 0, 0]);
    setLowerBeads([0, 0, 0, 0]);
    setUserReadAnswer("");
    setFeedback({ status: "idle", message: "" });
  };

  // Auto-record exercise session results to backend in real time
  const autoRecordProgress = async (newCorrect: number, newAttempted: number, newStars: number) => {
    if (studentId) {
      try {
        const res = await fetch("/api/erp/practice-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            studentName,
            assignmentTitle: `Abacus Flashcard Gym (${exerciseMode})`,
            type: "Addition",
            totalSums: newAttempted,
            correctSums: newCorrect,
            wrongSums: Math.max(0, newAttempted - newCorrect),
            accuracy: Math.round((newCorrect / newAttempted) * 100),
            starsEarned: newStars,
            mode: exerciseMode,
            timeTakenSeconds: elapsedSeconds,
            sessionId: gymSessionIdRef.current,
            digits: digitsCount,
            rows: 1
          })
        });
        const resJson = await res.json();
        if (resJson.success && onFinishExercise) {
          onFinishExercise({
            total: newAttempted,
            correct: newCorrect,
            stars: resJson.studentStars ?? newStars,
            mode: exerciseMode
          });
        }
      } catch (err) {
        console.error("Failed recording Abacus gym score:", err);
      }
    } else if (onFinishExercise) {
      onFinishExercise({
        total: newAttempted,
        correct: newCorrect,
        stars: newStars,
        mode: exerciseMode
      });
    }
  };

  // Check user answer in SET_BEADS mode
  const handleCheckSetBeads = () => {
    const isCorrect = currentAbacusValue === targetNumber;
    const newAttempted = totalAttempted + 1;
    setTotalAttempted(newAttempted);

    if (isCorrect) {
      playSound("correct", soundEnabled);
      const newCorrect = score + 1;
      setScore(newCorrect);
      setStreak(prev => prev + 1);
      const newStars = earnedStars + 3;
      setEarnedStars(newStars);
      setShowCelebration(true);
      setFeedback({
        status: "correct",
        message: `🎉 Spot on! ${targetNumber} correctly formed on the Abacus! (+3 Stars ⭐)`
      });

      autoRecordProgress(newCorrect, newAttempted, newStars);

      // Auto advance after 1.2s
      setTimeout(() => {
        startNextQuestion();
      }, 1200);
    } else {
      playSound("wrong", soundEnabled);
      setStreak(0);
      const newStars = Math.max(0, earnedStars - 1);
      setEarnedStars(newStars);
      setFeedback({
        status: "wrong",
        message: `❌ Not quite! (-1 Star 💔) Adjust your bead positions carefully and try again.`
      });

      autoRecordProgress(score, newAttempted, newStars);
    }
  };

  // Check user answer in READ_BEADS mode
  const handleCheckReadBeads = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const userVal = parseInt(userReadAnswer.trim(), 10);
    const isCorrect = userVal === targetNumber;
    const newAttempted = totalAttempted + 1;
    setTotalAttempted(newAttempted);

    if (isCorrect) {
      playSound("correct", soundEnabled);
      const newCorrect = score + 1;
      setScore(newCorrect);
      setStreak(prev => prev + 1);
      const newStars = earnedStars + 3;
      setEarnedStars(newStars);
      setShowCelebration(true);
      setFeedback({
        status: "correct",
        message: `🌟 Excellent! Correct answer! (+3 Stars ⭐)`
      });

      autoRecordProgress(newCorrect, newAttempted, newStars);

      setTimeout(() => {
        startNextQuestion();
      }, 1200);
    } else {
      playSound("wrong", soundEnabled);
      setStreak(0);
      const newStars = Math.max(0, earnedStars - 1);
      setEarnedStars(newStars);
      setFeedback({
        status: "wrong",
        message: `❌ Incorrect (-1 Star 💔). Look closely at the upper and lower beads on each rod and try again.`
      });

      autoRecordProgress(score, newAttempted, newStars);
    }
  };

  const getRodShortLabel = (rodIdx: number) => {
    switch (rodIdx) {
      case 0: return "1s";
      case 1: return "10s";
      case 2: return "100s";
      case 3: return "1000s";
      default: return "";
    }
  };

  const getRodFullLabel = (rodIdx: number) => {
    switch (rodIdx) {
      case 0: return "Units (1s)";
      case 1: return "Tens (10s)";
      case 2: return "Hundreds (100s)";
      case 3: return "Thousands (1000s)";
      default: return "";
    }
  };

  return (
    <div className={`bg-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-indigo-900/60 font-sans relative overflow-hidden ${className}`}>
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Abacus Bead Gym
            </span>
            {streak > 2 && (
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3 fill-rose-500" /> {streak} Streak!
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white font-display tracking-tight mt-1 flex items-center gap-2">
            🧮 Abacus Flashcard & Bead Gym
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Master bead manipulation, place values, and speed visual mental representation.
          </p>
        </div>

        {/* Real-time stats */}
        <div className="w-full sm:w-auto flex items-center justify-around sm:justify-end gap-2 sm:gap-3 bg-slate-800/80 border border-slate-700/60 p-2 rounded-2xl">
          <div className="text-center px-1.5 sm:px-2">
            <span className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">Score</span>
            <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono">{score} / {totalAttempted}</span>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div className="text-center px-1.5 sm:px-2">
            <span className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">Stars</span>
            <span className="text-xs sm:text-sm font-black text-amber-400 font-mono flex items-center gap-0.5">
              {earnedStars} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
            </span>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div className="text-center px-1.5 sm:px-2">
            <span className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">Timer</span>
            <span className="text-xs sm:text-sm font-black text-indigo-300 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Mode Selector & Settings */}
      <div className="py-3 sm:py-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 sm:p-1.5 rounded-2xl border border-slate-800 flex-1">
          <button
            type="button"
            onClick={() => setExerciseMode("SET_BEADS")}
            className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              exerciseMode === "SET_BEADS"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Grid className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">1. Set Number</span>
            <span className="sm:hidden">1. Set</span>
          </button>

          <button
            type="button"
            onClick={() => setExerciseMode("READ_BEADS")}
            className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              exerciseMode === "READ_BEADS"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">2. Read Beads</span>
            <span className="sm:hidden">2. Read</span>
          </button>

          <button
            type="button"
            onClick={() => setExerciseMode("FLASHCARDS")}
            className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              exerciseMode === "FLASHCARDS"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">3. Flashcard Speed</span>
            <span className="sm:hidden">3. Speed</span>
          </button>
        </div>

        {/* Digits & Flashcard Speed Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Flashcard timer speed selector if in FLASHCARDS mode */}
          {exerciseMode === "FLASHCARDS" && (
            <div className="flex items-center gap-1 bg-emerald-950/60 px-2 py-1 rounded-2xl border border-emerald-800/80">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider px-1">Flash:</span>
              {[0, 1, 2, 3, 5].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setFlashcardSeconds(sec);
                    setFlashcardTimerLeft(sec);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    flashcardSeconds === sec
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "text-emerald-300 hover:bg-emerald-900/50"
                  }`}
                >
                  {sec === 0 ? "Off" : `${sec}s`}
                </button>
              ))}
            </div>
          )}

          {/* Digits selector */}
          <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Digits:</span>
            {[1, 2, 3, 4].map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDigitsCount(d)}
                className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  digitsCount === d
                    ? "bg-indigo-500 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Sound toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              soundEnabled
                ? "bg-slate-800 border-slate-700 text-amber-400"
                : "bg-slate-900 border-slate-800 text-slate-500"
            }`}
            title={soundEnabled ? "Mute Chimes" : "Enable Chimes"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* MAIN EXERCISE STAGE */}
      <div className="my-2 bg-slate-950/80 rounded-2xl sm:rounded-3xl border border-slate-800 p-3 sm:p-6 relative">
        
        {/* Celebration Confetti Overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-xs rounded-2xl sm:rounded-3xl z-40 flex flex-col items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-emerald-500 text-slate-950 p-4 rounded-3xl shadow-2xl text-center space-y-1 transform animate-bounce">
                <Trophy className="w-10 h-10 mx-auto text-amber-950 fill-amber-300" />
                <h3 className="text-xl sm:text-2xl font-black font-display">EXCELLENT BEAD WORK!</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-950">+3 Leaderboard Stars ⭐</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. EXERCISE MODE: SET BEADS ("Show Number -> Kid Sets Abacus") */}
        {exerciseMode === "SET_BEADS" && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-950/80 border border-indigo-800/80 px-3 py-0.5 rounded-full">
                Target Challenge
              </span>
              <div className="text-xs text-slate-400">Set this target value on the Abacus below:</div>
              <div className="text-4xl sm:text-7xl font-black text-amber-400 font-display tracking-tight my-1 sm:my-2">
                {targetNumber}
              </div>
            </div>
          </div>
        )}

        {/* 2. EXERCISE MODE: READ BEADS ("Show Abacus -> Kid Reads Value") */}
        {exerciseMode === "READ_BEADS" && (
          <div className="space-y-2">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-950/80 border border-amber-800/80 px-3 py-0.5 rounded-full">
                Bead Reading Challenge
              </span>
              <div className="text-xs text-slate-400">Read the beads on the Abacus and enter the numeric value:</div>
            </div>
          </div>
        )}

        {/* 3. EXERCISE MODE: FLASHCARDS */}
        {exerciseMode === "FLASHCARDS" && (
          <div className="space-y-2">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/80 border border-emerald-800/80 px-3 py-0.5 rounded-full">
                Flashcard Speed Challenge
              </span>
              <div className="text-xs text-slate-400">
                {flashcardSeconds > 0 ? `Speed Flashcard (${flashcardSeconds}s auto-mask). Memorize the beads!` : "Rapid bead reading drill. Identify the value as fast as you can!"}
              </div>
              {flashcardSeconds > 0 && flashcardTimerLeft > 0 && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="bg-amber-400 h-full transition-all duration-1000"
                      style={{ width: `${(flashcardTimerLeft / flashcardSeconds) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">{flashcardTimerLeft}s</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INTERACTIVE VISUAL ABACUS FRAME */}
        <div className="my-4 sm:my-6 max-w-xl mx-auto bg-amber-950 rounded-2xl sm:rounded-3xl border-4 sm:border-8 border-amber-900 p-2.5 sm:p-6 shadow-2xl relative">
          {/* Frame Outer Metallic Accents */}
          <div className="absolute top-1.5 left-2 right-2 h-1 bg-amber-700/60 rounded-full" />
          <div className="absolute bottom-1.5 left-2 right-2 h-1 bg-amber-700/60 rounded-full" />

          {/* Abacus Container Header Bar */}
          <div className="flex justify-between items-center mb-2 sm:mb-3 text-[10px] font-black text-amber-200/80 uppercase tracking-wider border-b border-amber-900/60 pb-1.5">
            <span>Soroban {digitsCount}-Digit Abacus</span>
            <button
              type="button"
              onClick={handleClearAbacus}
              className="bg-amber-900 hover:bg-amber-800 text-amber-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 active:scale-95 text-[10px]"
            >
              <RotateCcw className="w-3 h-3" /> Reset (0)
            </button>
          </div>

          {/* FLASHCARD TIMED MASK OVERLAY */}
          {exerciseMode === "FLASHCARDS" && flashcardSeconds > 0 && flashcardTimerLeft === 0 && (
            <div className="my-2 bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-6 text-center space-y-3 z-30 shadow-2xl animate-fade-in">
              <Zap className="w-8 h-8 mx-auto text-amber-400 animate-pulse" />
              <h4 className="text-lg font-black text-amber-300 font-display">Time's Up! What was the number?</h4>
              <p className="text-xs text-slate-300">Enter your answer below, or peek at the beads if needed.</p>
              <button
                type="button"
                onClick={() => setFlashcardTimerLeft(flashcardSeconds)}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Peek Beads ({flashcardSeconds}s)
              </button>
            </div>
          )}

          {/* RODS CONTAINER */}
          {!(exerciseMode === "FLASHCARDS" && flashcardSeconds > 0 && flashcardTimerLeft === 0) && (
            <div className={`grid ${
              digitsCount === 1 ? "grid-cols-1 max-w-[120px] mx-auto" :
              digitsCount === 2 ? "grid-cols-2 sm:grid-cols-4 max-w-[280px] sm:max-w-none mx-auto" :
              digitsCount === 3 ? "grid-cols-3 sm:grid-cols-4 max-w-[360px] sm:max-w-none mx-auto" :
              "grid-cols-4"
            } gap-1.5 sm:gap-4 relative bg-amber-900/40 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-800/60`}>
              
              {/* Render Rods from Left (Thousands) to Right (Units) */}
              {[3, 2, 1, 0].map((rodIdx) => {
                const isRodActive = rodIdx < digitsCount;
                const upperActive = upperBeads[rodIdx] || 0;
                const lowerActiveCount = lowerBeads[rodIdx] || 0;

                // Hide inactive rods on mobile screens (<640px) when digitsCount < 4 so active rods expand nicely!
                if (!isRodActive) {
                  return (
                    <div
                      key={rodIdx}
                      className="hidden sm:flex opacity-25 flex-col items-center justify-center p-2 rounded-xl border border-dashed border-amber-800/60 min-h-[200px]"
                    >
                      <span className="text-[9px] font-mono font-bold text-amber-300">{getRodShortLabel(rodIdx)}</span>
                      <span className="text-[10px] font-bold text-amber-500 mt-2">Off</span>
                    </div>
                  );
                }

                return (
                  <div key={rodIdx} className="flex flex-col items-center space-y-1 sm:space-y-2 relative group w-full min-w-0">
                    {/* Rod Label */}
                    <div className="text-[10px] font-black text-amber-300 uppercase tracking-wider font-mono text-center truncate w-full">
                      <span className="sm:hidden">{getRodShortLabel(rodIdx)}</span>
                      <span className="hidden sm:inline">{getRodFullLabel(rodIdx)}</span>
                    </div>

                    {/* ROD COLUMN CONTAINER */}
                    <div className="w-full bg-[#fbf9f5] rounded-xl sm:rounded-2xl border-2 border-[#2b2118] p-1 sm:p-2 flex flex-col items-center relative min-h-[200px] sm:min-h-[220px] shadow-inner overflow-hidden">
                      
                      {/* Bamboo Vertical Rod Line */}
                      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2 bg-gradient-to-r from-[#9e6328] via-[#cca262] to-[#784618] z-0 shadow-inner" />

                      {/* UPPER DECK (Upper Bead = Value 5) */}
                      <div className="w-full h-[44px] sm:h-[48px] relative z-10 my-0.5">
                        <button
                          type="button"
                          onClick={() => handleToggleUpperBead(rodIdx)}
                          style={{
                            top: upperActive > 0 ? "22px" : "0px",
                            clipPath: "polygon(18% 0%, 82% 0%, 100% 50%, 82% 100%, 18% 100%, 0% 50%)"
                          }}
                          className={`absolute left-1/2 -translate-x-1/2 w-[92%] max-w-[50px] sm:max-w-[56px] h-[22px] sm:h-[24px] border transition-all duration-150 cursor-pointer ${
                            upperActive > 0
                              ? "bg-gradient-to-b from-[#e59b52] via-[#f7b068] to-[#9e5b22] border-t border-[#ffdfb8] shadow-lg z-20"
                              : "bg-gradient-to-b from-[#7a4822] via-[#94582b] to-[#593214] opacity-80 border-t border-[#a66a38] z-10 hover:opacity-100"
                          }`}
                          title={`${getRodFullLabel(rodIdx)} Upper Bead: Value 5`}
                        >
                          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-amber-100/30 pointer-events-none" />
                        </button>
                      </div>

                      {/* RECKONING BEAM / ANSWER BAR */}
                      <div className="w-full h-3.5 bg-white border-y-2 border-[#120a04] z-30 my-0.5 flex justify-center items-center relative shadow-xs">
                        {/* Alignment Dot on Units Rod */}
                        {rodIdx === 0 && (
                          <div className="w-2 h-2 bg-[#120a04] rounded-full shadow-2xs border border-amber-900" title="Units Rod Indicator" />
                        )}
                      </div>

                      {/* LOWER DECK (4 Lower Beads = Value 1 each) */}
                      <div className="w-full h-[110px] sm:h-[120px] relative z-10 my-0.5">
                        {[0, 1, 2, 3].map((beadIdx) => {
                          const isBeadActive = beadIdx < lowerActiveCount;
                          const beadH = 22;
                          const topPx = isBeadActive
                            ? beadIdx * beadH
                            : (beadIdx + 1) * beadH;

                          return (
                            <button
                              key={beadIdx}
                              type="button"
                              onClick={() => handleToggleLowerBead(rodIdx, beadIdx)}
                              style={{
                                top: `${topPx}px`,
                                clipPath: "polygon(18% 0%, 82% 0%, 100% 50%, 82% 100%, 18% 100%, 0% 50%)"
                              }}
                              className={`absolute left-1/2 -translate-x-1/2 w-[92%] max-w-[50px] sm:max-w-[56px] h-[22px] sm:h-[24px] border transition-all duration-150 cursor-pointer ${
                                isBeadActive
                                  ? "bg-gradient-to-b from-[#e59b52] via-[#f7b068] to-[#9e5b22] border-t border-[#ffdfb8] shadow-lg z-20"
                                  : "bg-gradient-to-b from-[#7a4822] via-[#94582b] to-[#593214] opacity-80 border-t border-[#a66a38] z-10 hover:opacity-100"
                              }`}
                              title={`${getRodFullLabel(rodIdx)} Lower Bead ${beadIdx + 1}: Value 1`}
                            >
                              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-amber-100/30 pointer-events-none" />
                            </button>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CONTROLS & SUBMISSION ACTIONS PER MODE */}
        <div className="max-w-md mx-auto space-y-3">
          
          {/* Mode 1: SET_BEADS Submission */}
          {exerciseMode === "SET_BEADS" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCheckSetBeads}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black py-3.5 sm:py-4 rounded-2xl shadow-xl shadow-indigo-900/50 active:scale-95 transition-all text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30"
              >
                <CheckCircle2 className="w-5 h-5 text-indigo-200" />
                <span>Check Bead Configuration</span>
              </button>
            </div>
          )}

          {/* Mode 2 & 3: READ_BEADS / FLASHCARDS Form Input */}
          {(exerciseMode === "READ_BEADS" || exerciseMode === "FLASHCARDS") && (
            <form onSubmit={handleCheckReadBeads} className="space-y-2.5">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="number"
                  placeholder="Type value..."
                  value={userReadAnswer}
                  onChange={(e) => setUserReadAnswer(e.target.value)}
                  className="flex-1 bg-slate-900 border-2 border-slate-700 focus:border-amber-400 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-xl sm:text-2xl font-black text-center text-amber-300 outline-none font-mono tracking-wider"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-lg active:scale-95 transition-all text-xs sm:text-sm uppercase tracking-wider cursor-pointer border border-amber-300 shrink-0"
                >
                  Submit
                </button>
              </div>

              {/* Touch Keypad for young children */}
              <div className="grid grid-cols-6 gap-1 sm:gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => {
                      playSound("click", soundEnabled);
                      setUserReadAnswer(prev => prev + String(digit));
                    }}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black py-2.5 rounded-xl text-sm font-mono active:scale-95 transition-all cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    playSound("clear", soundEnabled);
                    setUserReadAnswer(prev => prev.slice(0, -1));
                  }}
                  className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-all cursor-pointer col-span-2 flex items-center justify-center gap-1"
                >
                  ⌫ Back
                </button>
              </div>
            </form>
          )}

          {/* Feedback Banner */}
          {feedback.message && (
            <div className={`p-3 rounded-2xl text-xs font-bold text-center border ${
              feedback.status === "correct"
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                : "bg-rose-950/80 border-rose-500/50 text-rose-300"
            }`}>
              {feedback.message}
            </div>
          )}

          {/* Action buttons: Skip / Next Card */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => startNextQuestion()}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <ArrowRight className="w-3.5 h-3.5" /> Skip / Next Card
            </button>
          </div>

        </div>

      </div>

      {/* FOOTER TIPS */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Upper bead = 5 units | Lower beads = 1 unit each per rod</span>
        </div>
        <div className="text-slate-500">
          Geniplus Mental Arithmetic Bead Manipulations
        </div>
      </div>
    </div>
  );
}
