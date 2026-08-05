import React, { useState, useEffect } from "react";
import { 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Settings,
  ChevronDown,
  ChevronUp,
  Palette,
  Eye,
  EyeOff
} from "lucide-react";

interface VirtualAbacusProps {
  initialRods?: number;
  initialType?: "japanese" | "chinese";
  initialTheme?: "wooden" | "rainbow" | "sapphire";
  initialMACardMode?: boolean;
  onValueChange?: (value: number, rodValues: number[]) => void;
  showTitle?: boolean;
  title?: string;
  className?: string;
}

// Sound Chime Helper using Web Audio API
const playBeadSound = (enabled: boolean = true) => {
  if (!enabled) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.07);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch (e) {
    // Ignore audio context errors
  }
};

export default function VirtualAbacus({
  initialRods = 7,
  initialType = "japanese",
  initialTheme = "wooden",
  initialMACardMode = false,
  onValueChange,
  showTitle = true,
  title = "Interactive Virtual Soroban Abacus",
  className = ""
}: VirtualAbacusProps) {
  const [rodsCount, setRodsCount] = useState<number>(initialRods);
  const [beadTheme, setBeadTheme] = useState<"wooden" | "rainbow" | "sapphire">(initialTheme);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [maCardMode, setMaCardMode] = useState<boolean>(initialMACardMode);

  // Collapsible Settings Toolbar (Default closed for clutter-free pure abacus)
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Visibility Toggles - DEFAULT TO HIDDEN (Pure Physical Abacus Look - No numbers/labels)
  const [showTotalValue, setShowTotalValue] = useState<boolean>(false);
  const [showBottomDigits, setShowBottomDigits] = useState<boolean>(false);
  const [showTopLabels, setShowTopLabels] = useState<boolean>(false);

  // Active Teaching Mode
  const [teachingMode, setTeachingMode] = useState<"standard" | "multiplication" | "division" | "pure_abacus">("pure_abacus");

  // Selected Unit Rod Index (rod where 1s / Units place is located)
  const [unitRodIndex, setUnitRodIndex] = useState<number>(() => Math.max(0, initialRods - 3));

  const [customNumberInput, setCustomNumberInput] = useState<string>("");

  // Upper beads active state per rod (0 or 1)
  const [beadsUpper, setBeadsUpper] = useState<number[]>(() => Array(initialRods).fill(0));

  // Lower beads active count per rod (0 to 4)
  const [beadsLower, setBeadsLower] = useState<number[]>(() => Array(initialRods).fill(0));

  // Sync state if rodsCount changes
  useEffect(() => {
    setBeadsUpper(prev => {
      const next = Array(rodsCount).fill(0);
      for (let i = 0; i < Math.min(prev.length, rodsCount); i++) next[i] = prev[i];
      return next;
    });
    setBeadsLower(prev => {
      const next = Array(rodsCount).fill(0);
      for (let i = 0; i < Math.min(prev.length, rodsCount); i++) next[i] = prev[i];
      return next;
    });
    setUnitRodIndex(Math.max(0, rodsCount - 3));
  }, [rodsCount]);

  // Apply Teaching Mode Presets
  const applyTeachingMode = (mode: "standard" | "multiplication" | "division" | "pure_abacus") => {
    setTeachingMode(mode);
    if (mode === "pure_abacus") {
      setShowTotalValue(false);
      setShowBottomDigits(false);
      setShowTopLabels(false);
      setUnitRodIndex(Math.max(0, rodsCount - 3));
    } else if (mode === "multiplication") {
      // Middle Rod
      const middleIdx = Math.floor(rodsCount / 2);
      setUnitRodIndex(middleIdx);
      setShowTotalValue(false);
      setShowBottomDigits(false);
      setShowTopLabels(false);
    } else if (mode === "division") {
      // 3rd Rod from left
      setUnitRodIndex(Math.min(2, rodsCount - 1));
      setShowTotalValue(false);
      setShowBottomDigits(false);
      setShowTopLabels(false);
    } else {
      // Standard mode with digits & labels
      setUnitRodIndex(Math.max(0, rodsCount - 3));
      setShowTotalValue(true);
      setShowBottomDigits(true);
      setShowTopLabels(true);
    }
  };

  // Helper to determine rod metadata
  const getRodMeta = (rodIdx: number) => {
    const decimalPower = unitRodIndex - rodIdx;
    const isUnitRod = rodIdx === unitRodIndex;

    // Fixed physical Unit Dots on reckoning beam (every 3rd rod from right)
    const powerFromRight = rodsCount - 1 - rodIdx;
    const hasUnitDot = powerFromRight % 3 === 2;

    let label = "";
    if (decimalPower === -2) label = "0.01";
    else if (decimalPower === -1) label = "0.1";
    else if (decimalPower === 0) label = "U";
    else if (decimalPower === 1) label = "T";
    else if (decimalPower === 2) label = "H";
    else if (decimalPower === 3) label = "TH";
    else if (decimalPower === 4) label = "TTH";
    else if (decimalPower === 5) label = "L";
    else if (decimalPower === 6) label = "TL";
    else if (decimalPower === 7) label = "CR";
    else if (decimalPower === 8) label = "TCR";
    else label = `10^${decimalPower}`;

    return { decimalPower, isUnitRod, hasUnitDot, label };
  };

  // Calculate value of a single rod (0 to 9)
  const getRodValue = (rodIdx: number): number => {
    const upper = beadsUpper[rodIdx] || 0;
    const lower = beadsLower[rodIdx] || 0;
    return (upper * 5) + lower;
  };

  // Calculate total value across all rods
  const calculateTotalValue = (): number => {
    let total = 0;
    for (let i = 0; i < rodsCount; i++) {
      const rodVal = getRodValue(i);
      const { decimalPower } = getRodMeta(i);
      total += rodVal * Math.pow(10, decimalPower);
    }
    return Math.round(total * 100) / 100;
  };

  const totalValue = calculateTotalValue();

  // Format display string
  const formatAbacusValue = (val: number): string => {
    const rounded = Math.round(val * 100) / 100;
    if (rounded % 1 === 0) {
      return rounded.toLocaleString();
    } else {
      const parts = rounded.toFixed(2).split(".");
      return `${Number(parts[0]).toLocaleString()}.${parts[1]}`;
    }
  };

  // Notify parent on change
  useEffect(() => {
    if (onValueChange) {
      const rodVals = Array.from({ length: rodsCount }, (_, i) => getRodValue(i));
      onValueChange(totalValue, rodVals);
    }
  }, [beadsUpper, beadsLower, rodsCount, totalValue, unitRodIndex]);

  // Toggle upper bead
  const handleToggleUpper = (rodIdx: number) => {
    playBeadSound(soundEnabled);
    setBeadsUpper(prev => {
      const next = [...prev];
      next[rodIdx] = next[rodIdx] === 1 ? 0 : 1;
      return next;
    });
  };

  // Toggle lower bead - PERFECT PHYSICAL ABACUS INTERACTION LOGIC
  const handleToggleLower = (rodIdx: number, beadIdx: number) => {
    playBeadSound(soundEnabled);
    setBeadsLower(prev => {
      const next = [...prev];
      const current = next[rodIdx] || 0;
      
      if (beadIdx < current) {
        // Clicked bead is currently ACTIVE (pushed UP near reckoning beam).
        // Clicking it moves this bead AND all active beads below it DOWN.
        // Example: 4 active (beads 0,1,2,3). Click bead 0 (top bead) -> 0 < 4 -> active becomes 0 (all 4 move down).
        // Example: 4 active. Click bead 2 -> 2 < 4 -> active becomes 2 (beads 0,1 stay up, 2,3 move down).
        next[rodIdx] = beadIdx;
      } else {
        // Clicked bead is currently INACTIVE (pushed DOWN near bottom frame).
        // Clicking it moves this bead AND all inactive beads above it UP towards beam.
        // Example: 0 active. Click bead 0 -> 0 < 0 false -> active becomes 1 (bead 0 moves up).
        // Example: 0 active. Click bead 2 -> 2 < 0 false -> active becomes 3 (beads 0,1,2 move up).
        next[rodIdx] = beadIdx + 1;
      }
      return next;
    });
  };

  // Reset all beads
  const handleReset = () => {
    playBeadSound(soundEnabled);
    setBeadsUpper(Array(rodsCount).fill(0));
    setBeadsLower(Array(rodsCount).fill(0));
    setCustomNumberInput("");
  };

  // Set specific number on beads
  const handleSetCustomNumber = (inputStr: string) => {
    if (!inputStr) return;
    
    const parts = inputStr.trim().split(".");
    const intPart = parts[0].replace(/\D/g, "");
    const decPart = parts.length > 1 ? parts[1].replace(/\D/g, "").slice(0, 2) : "";

    const newUpper = Array(rodsCount).fill(0);
    const newLower = Array(rodsCount).fill(0);

    // Integer part digits start at Unit rod going LEFT
    const intDigits = intPart.split("").map(Number);
    for (let i = 0; i < intDigits.length; i++) {
      const digit = intDigits[intDigits.length - 1 - i];
      const rodIdx = unitRodIndex - i;

      if (rodIdx >= 0 && rodIdx < rodsCount) {
        if (digit >= 5) {
          newUpper[rodIdx] = 1;
          newLower[rodIdx] = digit - 5;
        } else {
          newUpper[rodIdx] = 0;
          newLower[rodIdx] = digit;
        }
      }
    }

    // Decimal part digits go right from Unit rod
    if (decPart.length > 0) {
      const dec1 = Number(decPart[0]) || 0;
      const rodTenths = unitRodIndex + 1;
      if (rodTenths < rodsCount) {
        newUpper[rodTenths] = dec1 >= 5 ? 1 : 0;
        newLower[rodTenths] = dec1 >= 5 ? dec1 - 5 : dec1;
      }
    }
    if (decPart.length > 1) {
      const dec2 = Number(decPart[1]) || 0;
      const rodHundredths = unitRodIndex + 2;
      if (rodHundredths < rodsCount) {
        newUpper[rodHundredths] = dec2 >= 5 ? 1 : 0;
        newLower[rodHundredths] = dec2 >= 5 ? dec2 - 5 : dec2;
      }
    }

    setBeadsUpper(newUpper);
    setBeadsLower(newLower);
  };

  // Get Bead Color Style depending on beadTheme
  const getUpperBeadStyle = (isActive: boolean) => {
    if (beadTheme === "wooden") {
      if (isActive) {
        return "bg-gradient-to-b from-[#e89c4a] via-[#f5b364] to-[#a35e24] border-t border-[#ffdfb8] shadow-md z-20";
      }
      return "bg-gradient-to-b from-[#7c4923] via-[#91562a] to-[#5c3315] opacity-90 border-t border-[#a66a38] z-10 hover:opacity-100";
    }
    if (beadTheme === "sapphire") {
      return isActive
        ? "bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-700 border-t border-cyan-200 shadow-md z-20"
        : "bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border-t border-slate-500 opacity-80 z-10";
    }
    // Rainbow
    return isActive
      ? "bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 border-t border-amber-200 shadow-md z-20"
      : "bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border-t border-slate-500 opacity-80 z-10";
  };

  const getLowerBeadStyle = (isActive: boolean, rodIdx: number) => {
    if (beadTheme === "wooden") {
      if (isActive) {
        return "bg-gradient-to-b from-[#e89c4a] via-[#f5b364] to-[#a35e24] border-t border-[#ffdfb8] shadow-md z-20";
      }
      return "bg-gradient-to-b from-[#7c4923] via-[#91562a] to-[#5c3315] opacity-90 border-t border-[#a66a38] z-10 hover:opacity-100";
    }
    if (beadTheme === "sapphire") {
      return isActive
        ? "bg-gradient-to-b from-indigo-400 via-indigo-600 to-purple-800 border-t border-indigo-200 shadow-md z-20"
        : "bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border-t border-slate-500 opacity-80 z-10";
    }
    // Rainbow by column
    const colPos = (rodsCount - 1 - rodIdx) % 4;
    if (isActive) {
      if (colPos === 0) return "bg-gradient-to-b from-indigo-400 via-indigo-500 to-indigo-700 border-t border-indigo-200 shadow-md z-20";
      if (colPos === 1) return "bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 border-t border-emerald-200 shadow-md z-20";
      if (colPos === 2) return "bg-gradient-to-b from-rose-400 via-rose-500 to-rose-700 border-t border-rose-200 shadow-md z-20";
      return "bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 border-t border-amber-200 shadow-md z-20";
    }
    return "bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border-t border-slate-500 opacity-80 z-10";
  };

  return (
    <div className={`bg-[#20130b] rounded-3xl border-2 border-[#3e2415] p-3 sm:p-5 shadow-2xl text-amber-100 space-y-4 select-none ${className}`}>
      
      {/* Top Header & Compact Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3b2213] pb-3">
        {showTitle && (
          <div>
            <h3 className="text-base font-black font-display text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {title}
            </h3>
            <p className="text-[11px] text-amber-200/60 font-semibold">
              Physical Soroban Wooden Abacus • {rodsCount} Rods
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          
          {/* Toggle Settings Menu */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#331c0e] hover:bg-[#422513] text-amber-200 text-xs font-bold rounded-xl border border-[#4d2b17] transition-all cursor-pointer shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Options</span>
            {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 bg-[#331c0e] hover:bg-[#422513] text-amber-200 rounded-xl border border-[#4d2b17] cursor-pointer"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Without Abacus / M.A. Card Mode Toggle */}
          <button
            type="button"
            onClick={() => setMaCardMode(!maCardMode)}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md border ${
              maCardMode
                ? "bg-purple-600 hover:bg-purple-500 text-white border-purple-400 ring-2 ring-purple-300"
                : "bg-[#331c0e] hover:bg-[#422513] text-amber-200 border-[#4d2b17]"
            }`}
            title="Toggle Without Abacus / M.A. Card Mode (Hide beads, only frame and rods visible for Mental Abacus visualization)"
          >
            {maCardMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-purple-200" />
                <span>M.A. Card (Beads Hidden)</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Without Abacus (M.A.)</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-md active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset (0)</span>
          </button>
        </div>
      </div>

      {/* Expandable Settings & Controls Bar */}
      {showSettings && (
        <div className="bg-[#180e08] p-3 rounded-2xl border border-[#3b2213] space-y-3 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Mode Presets */}
            <div className="flex flex-wrap items-center gap-1 bg-[#28160a] p-1 rounded-xl border border-[#3d2313] text-[10px] font-bold">
              <span className="text-amber-400 px-1 font-black">Mode:</span>
              <button
                type="button"
                onClick={() => applyTeachingMode("pure_abacus")}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  teachingMode === "pure_abacus"
                    ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                    : "text-amber-200 hover:bg-[#382010]"
                }`}
                title="Physical Abacus (No numbers/labels showing)"
              >
                🪵 Pure Abacus
              </button>
              <button
                type="button"
                onClick={() => applyTeachingMode("multiplication")}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  teachingMode === "multiplication"
                    ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                    : "text-amber-200 hover:bg-[#382010]"
                }`}
                title="Set Middle Rod for Multiplication"
              >
                ✖️ Multiplication
              </button>
              <button
                type="button"
                onClick={() => applyTeachingMode("division")}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  teachingMode === "division"
                    ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                    : "text-amber-200 hover:bg-[#382010]"
                }`}
                title="Set 3rd Rod for Division"
              >
                ➗ Division
              </button>
              <button
                type="button"
                onClick={() => applyTeachingMode("standard")}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  teachingMode === "standard"
                    ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                    : "text-amber-200 hover:bg-[#382010]"
                }`}
                title="Show Numbers & Place Labels"
              >
                📊 With Numbers
              </button>
            </div>

            {/* Rods Selector */}
            <div className="flex items-center gap-1 bg-[#28160a] p-1 rounded-xl border border-[#3d2313] text-[10px] font-bold">
              <span className="text-amber-300 px-1">Rods:</span>
              {[7, 11, 13, 15, 17].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRodsCount(r)}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    rodsCount === r
                      ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                      : "text-amber-200 hover:bg-[#382010]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Display Toggles */}
            <div className="flex items-center gap-1 bg-[#28160a] p-1 rounded-xl border border-[#3d2313] text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setShowTotalValue(!showTotalValue)}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  showTotalValue ? "bg-emerald-600 text-white font-black" : "text-amber-300/70 hover:bg-[#382010]"
                }`}
                title="Toggle Total Value Display"
              >
                Sum
              </button>
              <button
                type="button"
                onClick={() => setShowBottomDigits(!showBottomDigits)}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  showBottomDigits ? "bg-emerald-600 text-white font-black" : "text-amber-300/70 hover:bg-[#382010]"
                }`}
                title="Toggle Bottom Rod Digits"
              >
                Digits
              </button>
              <button
                type="button"
                onClick={() => setShowTopLabels(!showTopLabels)}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  showTopLabels ? "bg-emerald-600 text-white font-black" : "text-amber-300/70 hover:bg-[#382010]"
                }`}
                title="Toggle Top Place Labels"
              >
                Labels
              </button>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center gap-1 bg-[#28160a] p-1 rounded-xl border border-[#3d2313] text-[10px] font-bold">
              <Palette className="w-3 h-3 text-amber-400 ml-1" />
              <button
                type="button"
                onClick={() => setBeadTheme("wooden")}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  beadTheme === "wooden" ? "bg-amber-700 text-amber-100 font-black" : "text-amber-200"
                }`}
              >
                🪵 Wood
              </button>
              <button
                type="button"
                onClick={() => setBeadTheme("rainbow")}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  beadTheme === "rainbow" ? "bg-amber-700 text-amber-100 font-black" : "text-amber-200"
                }`}
              >
                🎨 Rainbow
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Value Display Bar (Shown if showTotalValue is true) */}
      {showTotalValue && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#180e08] p-3 rounded-2xl border border-[#3b2213]">
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-400">Total Value:</div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-200 tracking-wider">
              {formatAbacusValue(totalValue)}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Set number e.g. 125 or 12.5"
              value={customNumberInput}
              onChange={(e) => {
                setCustomNumberInput(e.target.value);
                handleSetCustomNumber(e.target.value);
              }}
              className="bg-[#0e0805] border border-[#3e2415] text-amber-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold outline-none focus:border-amber-400 w-full sm:w-48"
            />
          </div>
        </div>
      )}

      {/* PURE PHYSICAL SOROBAN ABACUS FRAME WITH HEAVY SOLID BLACK OUTER BORDER */}
      <div className="bg-[#000000] rounded-2xl border-[12px] border-[#000000] p-1.5 shadow-2xl overflow-x-auto relative">
        
        {/* M.A. Card Mode Active Floating Badge */}
        {maCardMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-purple-950/90 text-purple-200 border border-purple-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md pointer-events-none flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5 text-purple-400" />
            <span>Mental Abacus (M.A. Card) • Frame & Rods Only</span>
          </div>
        )}

        {/* Main Board Container */}
        <div className="min-w-fit flex justify-center gap-1 sm:gap-1.5 relative">
          
          {/* Continuous Inner White Canvas Box Enclosing All Rods */}
          <div className="bg-[#ffffff] border-2 border-[#120a04] px-1 sm:px-1.5 py-1.5 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
            
            {/* Top Header Labels Row (if enabled) */}
            {showTopLabels && (
              <div className="flex justify-center gap-1 sm:gap-1.5 w-full mb-1">
                {Array.from({ length: rodsCount }).map((_, rodIdx) => {
                  const { isUnitRod, label } = getRodMeta(rodIdx);
                  return (
                    <div key={rodIdx} className={`w-7 sm:w-8.5 text-[10px] font-mono font-black text-center tracking-tighter truncate ${
                      isUnitRod ? "text-amber-950 bg-amber-200 px-0.5 rounded font-extrabold" : "text-slate-600"
                    }`}>
                      {label}
                    </div>
                  );
                })}
              </div>
            )}

            {/* PHYSICAL ABACUS ROD FRAME (Upper Deck 48px + Beam 18px + Lower Deck 120px = 186px) */}
            <div className="relative flex justify-center gap-1 sm:gap-1.5 h-[186px]">
              
              {/* CONTINUOUS RECKONING BEAM (WHITE SEPARATOR BAR WITH BLACK OUTLINE BORDERS) */}
              {/* Positioned directly between Upper Deck (top 0..48px) and Lower Deck (top 66..186px) */}
              <div className="absolute left-[-8px] right-[-8px] top-[48px] h-[18px] bg-[#ffffff] border-y-2 border-[#000000] z-30 flex items-center shadow-xs pointer-events-none">
                {/* Thin horizontal center alignment line across answer beam */}
                <div className="w-full h-[1px] bg-[#000000] opacity-90" />
              </div>

              {/* Rod Columns */}
              {Array.from({ length: rodsCount }).map((_, rodIdx) => {
                const val = getRodValue(rodIdx);
                const { hasUnitDot, label } = getRodMeta(rodIdx);

                const upperActive = beadsUpper[rodIdx] || 0;
                const lowerActive = beadsLower[rodIdx] || 0;

                return (
                  <div key={rodIdx} className="flex flex-col items-center group shrink-0 w-7 sm:w-8.5">
                    
                    {/* ROD COLUMN CONTAINER */}
                    <div className="w-full flex flex-col items-center relative h-[186px] overflow-hidden">
                      
                      {/* Bamboo Wooden Rod Line running top to bottom */}
                      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 sm:w-2 bg-gradient-to-r from-[#9e6328] via-[#cca262] to-[#784618] z-0 shadow-inner" />

                      {/* Fixed Unit Dot on Reckoning Beam (Every 3rd Rod) - Positioned in exact vertical center of 18px answer beam */}
                      {hasUnitDot && (
                        <div 
                          className="absolute left-1/2 -translate-x-1/2 top-[57px] -translate-y-1/2 w-2.5 h-2.5 bg-[#000000] rounded-full z-40 shadow-2xs border border-[#000000]" 
                          title={`Unit Dot (${label})`} 
                        />
                      )}

                      {/* UPPER DECK (Height = 48px) */}
                      <div className="w-full h-[48px] relative z-10">
                        <button
                          type="button"
                          onClick={() => handleToggleUpper(rodIdx)}
                          style={{
                            top: upperActive > 0 ? "24px" : "0px",
                            clipPath: "polygon(18% 0%, 82% 0%, 100% 50%, 82% 100%, 18% 100%, 0% 50%)"
                          }}
                          className={`absolute left-1/2 -translate-x-1/2 w-[94%] h-[24px] border transition-all duration-150 cursor-pointer ${
                            maCardMode ? "opacity-0 pointer-events-none invisible" : getUpperBeadStyle(upperActive > 0)
                          }`}
                          title={`${label} Upper Bead (Value 5)`}
                        >
                          {/* Center Diamond Ridge Line */}
                          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-amber-100/30 pointer-events-none" />
                        </button>
                      </div>

                      {/* RECKONING BEAM GAP SPACER (18px height) */}
                      <div className="w-full h-[18px] z-20 pointer-events-none" />

                      {/* LOWER DECK (Height = 120px) */}
                      <div className="w-full h-[120px] relative z-10">
                        {[0, 1, 2, 3].map((bIdx) => {
                          const isActive = bIdx < lowerActive;
                          const beadH = 24;

                          // ACTIVE beads stack AT TOP touching reckoning beam (top = bIdx * 24px)
                          // INACTIVE beads stack AT BOTTOM touching bottom frame (top = (bIdx + 1) * 24px)
                          const topPx = isActive
                            ? bIdx * beadH
                            : (bIdx + 1) * beadH;

                          return (
                            <button
                              key={bIdx}
                              type="button"
                              onClick={() => handleToggleLower(rodIdx, bIdx)}
                              style={{
                                top: `${topPx}px`,
                                clipPath: "polygon(18% 0%, 82% 0%, 100% 50%, 82% 100%, 18% 100%, 0% 50%)"
                              }}
                              className={`absolute left-1/2 -translate-x-1/2 w-[94%] h-[24px] border transition-all duration-150 cursor-pointer ${
                                maCardMode ? "opacity-0 pointer-events-none invisible" : getLowerBeadStyle(isActive, rodIdx)
                              }`}
                              title={`${label} Lower Bead ${bIdx + 1} (Value 1)`}
                            >
                              {/* Center Diamond Ridge Line */}
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

            {/* Bottom Digits Display Row (if enabled) */}
            {showBottomDigits && (
              <div className="flex justify-center gap-1 sm:gap-1.5 w-full mt-1">
                {Array.from({ length: rodsCount }).map((_, rodIdx) => {
                  const val = getRodValue(rodIdx);
                  return (
                    <div key={rodIdx} className="w-7 sm:w-8.5">
                      <div className={`text-[10px] font-black font-mono px-1 py-0.5 rounded border text-center w-full ${
                        val > 0
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-2xs"
                          : "bg-[#180e08] text-amber-200/50 border-[#3d2313]"
                      }`}>
                        {val}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
