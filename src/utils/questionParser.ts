import { ExamQuestionItem } from "../types";

export type QuestionTypeCategory = 
  | "Abacus Sum"
  | "Multiplication"
  | "Division"
  | "Percentage"
  | "HCF_LCM"
  | "MCQ"
  | "Short Answer";

// Helper to compute HCF / GCD
export function calculateHCF(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

// Helper to compute LCM
export function calculateLCM(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a * b) / calculateHCF(a, b));
}

/**
 * Smart Parser & Auto-Calculator for Questions
 */
export function autoEvaluateQuestion(
  type: QuestionTypeCategory | undefined,
  input: string | undefined,
  optionsInput: string = "",
  manualAnswer: string = ""
): ExamQuestionItem {
  // If draft is somehow passed as a string or object unexpectedly
  let qType = type || "Abacus Sum";
  let rawInput = input || "";

  // If type was omitted and input was passed as first arg or draft was string
  if (typeof type === "string" && !input && (type.includes(",") || type.includes("="))) {
    rawInput = type;
    qType = "Abacus Sum";
  }

  const cleanInput = String(rawInput || "").trim();

  if (qType === "Abacus Sum") {
    const parts = cleanInput.split(/[,,| ]+/).map(p => p.trim()).filter(Boolean);
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
      questionType: "Abacus Sum",
      expression: expression || cleanInput || "0",
      answer: sumVal,
      rows: rows.length > 0 ? rows : undefined
    };
  }

  if (type === "Multiplication") {
    // e.g. "45 * 6" or "45 x 6" or "45, 6"
    const numbers = cleanInput.replace(/x/gi, "*").match(/\d+/g)?.map(Number) || [];
    let ans = 0;
    let expr = cleanInput;
    if (numbers.length >= 2) {
      ans = numbers.reduce((acc, curr) => acc * curr, 1);
      expr = `${numbers[0]} × ${numbers[1]}`;
    }
    return {
      questionType: "Multiplication",
      expression: expr || cleanInput,
      answer: ans
    };
  }

  if (type === "Division") {
    // e.g. "144 / 12" or "144 ÷ 12" or "144, 12"
    const numbers = cleanInput.replace(/÷/gi, "/").match(/\d+/g)?.map(Number) || [];
    let ans = 0;
    let expr = cleanInput;
    if (numbers.length >= 2 && numbers[1] !== 0) {
      ans = Math.floor(numbers[0] / numbers[1]);
      expr = `${numbers[0]} ÷ ${numbers[1]}`;
    }
    return {
      questionType: "Division",
      expression: expr || cleanInput,
      answer: ans
    };
  }

  if (type === "Percentage") {
    // e.g. "15% of 200" or "15, 200"
    const numbers = cleanInput.match(/\d+(\.\d+)?/g)?.map(Number) || [];
    let ans = 0;
    let expr = cleanInput;
    if (numbers.length >= 2) {
      const pct = numbers[0];
      const val = numbers[1];
      ans = Math.round((pct / 100) * val * 100) / 100;
      expr = `${pct}% of ${val}`;
    }
    return {
      questionType: "Percentage",
      expression: expr || cleanInput,
      answer: ans
    };
  }

  if (type === "HCF_LCM") {
    // e.g. "HCF of 12, 18" or "LCM of 4, 6" or "12, 18"
    const numbers = cleanInput.match(/\d+/g)?.map(Number) || [];
    const isLCM = cleanInput.toLowerCase().includes("lcm");
    let ans = 0;
    let expr = cleanInput;
    if (numbers.length >= 2) {
      const a = numbers[0];
      const b = numbers[1];
      ans = isLCM ? calculateLCM(a, b) : calculateHCF(a, b);
      expr = `${isLCM ? "LCM" : "HCF"} of ${a} and ${b}`;
    }
    return {
      questionType: "HCF_LCM",
      expression: expr || cleanInput,
      answer: ans
    };
  }

  if (type === "MCQ") {
    const opts = optionsInput.split(/[,,|]+/).map(o => o.trim()).filter(Boolean);
    return {
      questionType: "MCQ",
      expression: cleanInput || "Sample Question",
      options: opts.length > 0 ? opts : ["Option A", "Option B", "Option C", "Option D"],
      answer: manualAnswer.trim() || (opts[0] || "Option A")
    };
  }

  // Short Answer / Concept Formula
  return {
    questionType: "Short Answer",
    expression: cleanInput || "Concept Question",
    answer: manualAnswer.trim() || cleanInput
  };
}
