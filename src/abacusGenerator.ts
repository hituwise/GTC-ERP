export interface AbacusSum {
  id: number;
  rows: string[];
  answer: number;
}

export interface AbacusWorksheet {
  title: string;
  level: number;
  instructions: string;
  sums: AbacusSum[];
  practiceType: string;
}

/**
 * Validates whether a step is directly performable on Level 1 (Direct bead calculation only).
 * On Level 1, we don't use formulas (Big/Little Friends).
 * For a single digit column, the state is represented by an upper bead (value 5) and 4 lower beads (values 1, 2, 3, 4).
 * A direct addition of x (1 to 9) to current total S:
 * - If adding:
 *   - Lower beads needed: if we add a value 1-4, it can only be done directly if (S % 5) + x <= 4.
 *   - Upper bead: if we add 5, S must not already have the upper bead active (i.e. S < 5).
 *   - Combining upper and lower: e.g. adding 6 (+5 and +1) requires upper bead free (S < 5) and lower beads available ((S % 5) + 1 <= 4).
 * - If subtracting:
 *   - Lower beads: subtracting 1-4 requires (S % 5) >= x.
 *   - Upper bead: subtracting 5 requires S >= 5.
 */
function isDirectBeadStep(current: number, next: number): boolean {
  if (next > 0) {
    const nextUpper = next >= 5 ? 5 : 0;
    const nextLower = next % 5;
    const currentUpper = current >= 5 ? 5 : 0;
    const currentLower = current % 5;
    
    // Direct addition is valid if we don't overflow the physical bead limits:
    if (nextUpper === 5 && currentUpper === 5) return false; // Upper bead already active
    if (currentLower + nextLower > 4) return false; // Lower beads exceed 4
    return true;
  } else {
    const sub = Math.abs(next);
    const subUpper = sub >= 5 ? 5 : 0;
    const subLower = sub % 5;
    const currentUpper = current >= 5 ? 5 : 0;
    const currentLower = current % 5;
    
    // Direct subtraction is valid if beads are present to be cleared:
    if (subUpper === 5 && currentUpper === 0) return false; // No upper bead to clear
    if (currentLower < subLower) return false; // Not enough lower beads to clear
    return true;
  }
}

/**
 * Core Abacus Sums Generator matching Levels 1 to 8 perfectly.
 */
export function generateAbacusSums(
  level: number,
  type: string,
  digits: number = 1,
  rows: number = 3,
  count: number = 10,
  difficulty: "Easy" | "Medium" | "Hard" = "Medium"
): AbacusSum[] {
  const sums: AbacusSum[] = [];
  const generatedKeys = new Set<string>();

  // Ensure reasonable limits
  const maxDigits = Math.max(1, Math.min(10, digits));
  const maxRows = Math.max(1, Math.min(20, rows));
  const maxCount = Math.max(1, Math.min(100, count));

  for (let i = 0; i < maxCount; i++) {
    let attempt = 0;
    let validSum = false;
    let finalRows: string[] = [];
    let finalAnswer = 0;

    while (!validSum && attempt < 200) {
      attempt++;
      const stepRows: string[] = [];
      let runningTotal = 0;

      // Type-specific generation
      if (type === "Multiplication") {
        // Multiplication is only allowed for Level 4-8
        if (level < 4) {
          // Fallback
          type = "Addition";
        } else {
          // Generate a single multiplication sum: e.g. "45 x 6"
          let d1 = 2; // multiplicand digits
          let d2 = 1; // multiplier digits
          if (level === 5) { d1 = 3; d2 = 1; }
          else if (level >= 6) { d1 = 3; d2 = 2; }
          
          if (difficulty === "Easy") { d1 = 2; d2 = 1; }
          else if (difficulty === "Hard") { d1 = 4; d2 = 2; }

          const min1 = Math.pow(10, d1 - 1);
          const max1 = Math.pow(10, d1) - 1;
          const min2 = Math.pow(10, d2 - 1);
          const max2 = Math.pow(10, d2) - 1;

          const num1 = Math.floor(min1 + Math.random() * (max1 - min1 + 1));
          const num2 = Math.floor(min2 + Math.random() * (max2 - min2 + 1));
          
          stepRows.push(`${num1}`);
          stepRows.push(`x ${num2}`);
          runningTotal = num1 * num2;
          
          const key = `${num1}x${num2}`;
          if (!generatedKeys.has(key)) {
            generatedKeys.add(key);
            finalRows = stepRows;
            finalAnswer = runningTotal;
            validSum = true;
          }
          continue;
        }
      }

      if (type === "Division") {
        // Division is only allowed for Level 6-8
        if (level < 6) {
          type = "Addition";
        } else {
          // Generate a single division sum: e.g. "245 / 5"
          let d1 = 3; // dividend digits
          let d2 = 1; // divisor digits
          if (level === 7) { d1 = 4; d2 = 1; }
          else if (level >= 8) { d1 = 4; d2 = 2; }

          if (difficulty === "Easy") { d1 = 3; d2 = 1; }
          else if (difficulty === "Hard") { d1 = 5; d2 = 2; }

          const divisor = Math.floor(Math.pow(10, d2 - 1) + Math.random() * (Math.pow(10, d2) - Math.pow(10, d2 - 1)));
          // To ensure clean division with no remainder, generate the quotient first
          const minQ = Math.pow(10, d1 - d2 - 1);
          const maxQ = Math.pow(10, d1 - d2) - 1;
          const quotient = Math.floor(minQ + Math.random() * (maxQ - minQ + 1));
          const dividend = quotient * divisor;

          stepRows.push(`${dividend}`);
          stepRows.push(`÷ ${divisor}`);
          runningTotal = quotient;

          const key = `${dividend}/${divisor}`;
          if (!generatedKeys.has(key)) {
            generatedKeys.add(key);
            finalRows = stepRows;
            finalAnswer = runningTotal;
            validSum = true;
          }
          continue;
        }
      }

      // Default: Addition / Subtraction / Mixed
      let isMixed = type === "Mixed Addition & Subtraction" || type === "Mixed Practice" || type === "Speed Practice" || type === "Oral Practice" || type === "Dictation Practice" || type === "Exam Practice" || type === "Flash Practice";
      let forceOnlyAddition = type === "Addition";
      let forceOnlySubtraction = type === "Subtraction"; // Usually mixed with a positive starting term

      // Determine digit ranges depending on level
      let dVal = maxDigits;
      if (level === 1) dVal = 1; // Strict Level 1 rule
      else if (level === 2) dVal = Math.min(2, maxDigits);
      else if (level === 3) dVal = Math.min(3, maxDigits);

      const minNum = Math.pow(10, dVal - 1);
      const maxNum = Math.pow(10, dVal) - 1;

      // First Row: Must be positive
      let term = Math.floor(minNum + Math.random() * (maxNum - minNum + 1));
      runningTotal = term;
      stepRows.push(`${term}`);

      let stepValid = true;
      for (let r = 1; r < maxRows; r++) {
        let nextTerm = Math.floor(minNum + Math.random() * (maxNum - minNum + 1));
        let isSubtract = false;

        if (forceOnlySubtraction) {
          isSubtract = true;
        } else if (forceOnlyAddition) {
          isSubtract = false;
        } else {
          // Mixed Addition & Subtraction
          isSubtract = Math.random() > 0.45; // 45% chance of subtraction
        }

        if (isSubtract) {
          // Constraint check: Running answer must never become negative
          if (runningTotal - nextTerm < 0) {
            // Adjust nextTerm so it doesn't go below zero, or force addition
            if (runningTotal > minNum) {
              nextTerm = Math.floor(minNum + Math.random() * (runningTotal - minNum + 1));
            } else {
              isSubtract = false; // Force addition if runningTotal is too small
            }
          }
        }

        // LEVEL 1 STRICT COMPLIANCE: Direct bead movements only
        if (level === 1) {
          // Verify direct calculation column by column for Level 1
          // Since digits = 1 for level 1, runningTotal and nextTerm are single digits
          const signedNext = isSubtract ? -nextTerm : nextTerm;
          if (!isDirectBeadStep(runningTotal, signedNext)) {
            // Find a valid nextTerm that IS a direct bead step
            let foundDirect = false;
            const options = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            // Shuffle options
            options.sort(() => Math.random() - 0.5);
            for (let opt of options) {
              // try add
              if (!isSubtract && isDirectBeadStep(runningTotal, opt)) {
                nextTerm = opt;
                foundDirect = true;
                break;
              }
              // try subtract
              if (isSubtract && runningTotal - opt >= 0 && isDirectBeadStep(runningTotal, -opt)) {
                nextTerm = opt;
                foundDirect = true;
                break;
              }
            }
            if (!foundDirect) {
              stepValid = false;
              break;
            }
          }
        }

        runningTotal = isSubtract ? runningTotal - nextTerm : runningTotal + nextTerm;
        stepRows.push(`${isSubtract ? "-" : "+"}${nextTerm}`);
      }

      if (stepValid && runningTotal >= 0) {
        const key = stepRows.join(",");
        if (!generatedKeys.has(key)) {
          generatedKeys.add(key);
          finalRows = stepRows;
          finalAnswer = runningTotal;
          validSum = true;
        }
      }
    }

    if (validSum) {
      sums.push({
        id: i + 1,
        rows: finalRows,
        answer: finalAnswer,
      });
    } else {
      // Emergency fallback in case loops exit without completing
      sums.push({
        id: i + 1,
        rows: ["10", "+5", "-2"],
        answer: 13,
      });
    }
  }

  return sums;
}

/**
 * Dynamic localized instructions based on practice type and language.
 */
export function getLocalizedInstructions(type: string, level: number, lang: "English" | "Hindi" | "Gujarati"): string {
  const isEng = lang === "English";
  const isHindi = lang === "Hindi";
  
  if (type === "Multiplication") {
    if (isEng) return `Level ${level} Multiplication: Multiply the multiplicand with the multiplier on the abacus frame. Write the exact final product.`;
    if (isHindi) return `स्तर ${level} गुणा: अबेकस फ्रेम पर गुण्य को गुणाक से गुणा करें। सटीक उत्तर लिखें।`;
    return `લેવલ ${level} ગુણાકાર: અબેકસ ફ્રેમ પર ગુણાકાર કરો. સાચો જવાબ લખો.`;
  }
  if (type === "Division") {
    if (isEng) return `Level ${level} Division: Solve the division equations. Find the exact quotients on the abacus.`;
    if (isHindi) return `स्तर ${level} भाग: भाग के प्रश्नों को हल करें। अबेकस पर सही भागफल ज्ञात करें।`;
    return `લેવલ ${level} ભાગાકાર: ભાગાકારના દાખલાઓ હલ કરો. અબેકસ પર સાચો ભાગફળ શોધો.`;
  }
  if (level === 1) {
    if (isEng) return `Level 1 Direct Bead Practice: Identify the beads, and perform simple calculations using direct thumb (upwards) and index finger (downwards) movements. No formulas allowed.`;
    if (isHindi) return `स्तर 1 डायरेक्ट बीड अभ्यास: मोतियों को पहचानें, और केवल अंगूठे और तर्जनी का उपयोग करके सीधे जोड़-घटाव करें। कोई सूत्र लागू नहीं है।`;
    return `લેવલ 1 ડાયરેક્ટ બીડ અભ્યાસ: મોતી ઓળખો, અને અંગૂઠા અને આંગળીની મદદથી ડાયરેક્ટ સરવાળા-બાદબાકી કરો. કોઈ ફોર્મ્યુલા વાપરવી નહીં.`;
  }

  if (isEng) return `Level ${level} Mixed Mental Math: Solve each sum row by row on your abacus or visualize the beads mentally for speed and accuracy.`;
  if (isHindi) return `स्तर ${level} मिश्रित मानसिक गणित: प्रत्येक जोड़-घटाव को अबेकस पर या मन में मोतियों की कल्पना करके तेजी से हल करें।`;
  return `લેવલ ${level} મિશ્ર માનસિક ગણિત: અબેકસ પર અથવા મનમાં મોતીની કલ્પના કરીને દરેક દાખલો ઝડપથી હલ કરો.`;
}
