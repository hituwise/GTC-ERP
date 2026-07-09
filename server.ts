import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" })); // Support large profile photo base64 strings
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Global In-Memory multi-tenant store
const db: { [key: string]: any[] } = {
  admins: [
    { email: "genipluskids@gmail.com", name: "Geniplus Owner", password: "geniplus@2026" },
    { email: "admin@geniplus.com", name: "Super Admin (Demo)", password: "password123" }
  ],
  centers: [],
  teachers: [],
  students: [],
  leads: [],
  attendance: [],
  fees: [],
  feeStructures: [],
  expenses: [],
  homework: [],
  exams: [],
  practiceAssignments: [],
  practiceSubmissions: [],
  leaderboard: [],
  customWorksheets: []
};

// Lazy initialize Gemini API client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables. Gemini features may fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving persistent database:", err);
  }
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      // Create a safety backup on server startup
      try {
        const backupDir = path.join(process.cwd(), "backups");
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupFile = path.join(backupDir, `db_backup_${timestamp}.json`);
        fs.copyFileSync(DB_FILE, backupFile);
        console.log(`[DATA SAFEGUARD] Safety backup of database created at: ${backupFile}`);
      } catch (backupErr) {
        console.error("Failed to create database startup backup:", backupErr);
      }

      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      Object.keys(parsed).forEach(key => {
        db[key] = parsed[key];
      });

      // DATABASE INTEGRITY UPGRADE: Guarantee all franchise centers, teachers/staff, and students are active
      if (Array.isArray(db.centers)) {
        db.centers.forEach(c => {
          if (!c.status) c.status = "Active";
        });
      }
      if (Array.isArray(db.teachers)) {
        db.teachers.forEach(t => {
          if (!t.status) t.status = "Active";
        });
      }
      if (Array.isArray(db.students)) {
        db.students.forEach(s => {
          if (!s.status) s.status = "Active";
        });
      }

      if (!db.customWorksheets || !Array.isArray(db.customWorksheets)) {
        db.customWorksheets = [];
      }

      if (db.customWorksheets.length === 0) {
        db.customWorksheets = [
          {
            id: "CW001",
            title: "Level 1 - Week 1: Direct Numbers (+1 to +4)",
            level: 1,
            conceptName: "Direct Bead Movements",
            sums: [
              { expression: "1 + 2 + 1", answer: 4, rows: [1, 2, 1] },
              { expression: "2 + 2 - 3", answer: 1, rows: [2, 2, -3] },
              { expression: "3 - 1 + 2", answer: 4, rows: [3, -1, 2] },
              { expression: "4 - 2 - 1", answer: 1, rows: [4, -2, -1] },
              { expression: "1 + 1 + 2", answer: 4, rows: [1, 1, 2] }
            ],
            createdByTeacherId: "T001",
            createdByTeacherName: "Sunitha Rao",
            createdAt: "2026-07-08T00:00:00.000Z"
          },
          {
            id: "CW002",
            title: "Level 1 - Week 2: Direct 5 Bead (+5 & -5)",
            level: 1,
            conceptName: "5 Bead Activation",
            sums: [
              { expression: "5 + 2 + 1", answer: 8, rows: [5, 2, 1] },
              { expression: "6 - 1 + 3", answer: 8, rows: [6, -1, 3] },
              { expression: "7 - 5 + 2", answer: 4, rows: [7, -5, 2] },
              { expression: "5 + 4 - 3", answer: 6, rows: [5, 4, -3] },
              { expression: "8 - 3 + 4", answer: 9, rows: [8, -3, 4] }
            ],
            createdByTeacherId: "T001",
            createdByTeacherName: "Sunitha Rao",
            createdAt: "2026-07-08T00:00:00.000Z"
          }
        ];
      }

      console.log("Persistent database loaded and validated successfully from db.json");
    } else {
      saveDb();
    }
  } catch (err) {
    console.error("Error loading persistent database:", err);
  }
}

loadDb();

// Auto-save database on any mutative ERP endpoint requests
app.use("/api/erp/*", (req, res, next) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    res.on("finish", () => {
      saveDb();
    });
  }
  next();
});

// ERP Data endpoints
app.get("/api/erp/data", (req, res) => {
  res.json({ success: true, data: db });
});

// Admin add/update entities
app.post("/api/erp/add-center", (req, res) => {
  const newCenter = {
    id: `C00${db.centers.length + 1}`,
    name: req.body.name || "Geniplus Center",
    ownerName: req.body.ownerName || "New Owner",
    mobile: req.body.mobile || "",
    email: req.body.email || "",
    city: req.body.city || "",
    state: req.body.state || "",
    country: req.body.country || "India",
    plan: req.body.plan || "Standard",
    password: req.body.password || "password123",
    subscriptionStart: new Date().toISOString().split("T")[0],
    subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "Active"
  };
  db.centers.push(newCenter);
  res.json({ success: true, center: newCenter });
});

app.post("/api/erp/add-teacher", (req, res) => {
  const newTeacher = {
    id: `T00${db.teachers.length + 1}`,
    centerId: req.body.centerId || "C001",
    name: req.body.name || "New Teacher",
    email: req.body.email || "",
    mobile: req.body.mobile || "",
    joiningDate: new Date().toISOString().split("T")[0],
    role: req.body.role || "Teacher",
    status: "Active",
    password: req.body.password || "password123"
  };
  db.teachers.push(newTeacher);
  res.json({ success: true, teacher: newTeacher });
});

app.post("/api/erp/add-student", (req, res) => {
  const firstName = (req.body.studentName || "student").split(" ")[0].toLowerCase();
  const newStudent = {
    id: `S00${db.students.length + 1}`,
    centerId: req.body.centerId || "C001",
    teacherId: req.body.teacherId || "T001",
    studentName: req.body.studentName || "New Student",
    parentName: req.body.parentName || "",
    parentMobile: req.body.parentMobile || "",
    dateOfBirth: req.body.dateOfBirth || "2018-01-01",
    age: Number(req.body.age) || 8,
    school: req.body.school || "",
    currentLevel: Number(req.body.currentLevel) || 1,
    batch: req.body.batch || "Sat 10:00 AM",
    joiningDate: new Date().toISOString().split("T")[0],
    status: "Active",
    email: req.body.email || `${firstName}@gmail.com`,
    password: req.body.password || "password123"
  };
  db.students.push(newStudent);
  res.json({ success: true, student: newStudent });
});

app.post("/api/erp/add-lead", (req, res) => {
  const newLead = {
    id: `L00${db.leads.length + 1}`,
    centerId: req.body.centerId || "C001",
    name: req.body.name || "New Enquirer",
    parentName: req.body.parentName || "",
    parentMobile: req.body.parentMobile || "",
    source: req.body.source || "Walk-In",
    campaign: req.body.campaign || "Direct Enquiry",
    counsellor: req.body.counsellor || "Staff",
    status: req.body.status || "New Lead",
    date: new Date().toISOString().split("T")[0],
    remarks: req.body.remarks || ""
  };
  db.leads.push(newLead);
  res.json({ success: true, lead: newLead });
});

app.post("/api/erp/add-expense", (req, res) => {
  const newExpense = {
    id: `E00${db.expenses.length + 1}`,
    centerId: req.body.centerId || "C001",
    category: req.body.category || "Miscellaneous",
    amount: Number(req.body.amount) || 0,
    date: req.body.date || new Date().toISOString().split("T")[0],
    description: req.body.description || ""
  };
  db.expenses.push(newExpense);
  res.json({ success: true, expense: newExpense });
});

app.post("/api/erp/add-attendance", (req, res) => {
  const records = req.body.records || []; // array of { studentId, status, level, batch }
  const today = new Date().toISOString().split("T")[0];
  records.forEach((record: any) => {
    // Check if attendance already marked for student on this date
    const idx = db.attendance.findIndex(a => a.studentId === record.studentId && a.date === today);
    if (idx !== -1) {
      db.attendance[idx].status = record.status;
    } else {
      db.attendance.push({
        studentId: record.studentId,
        date: today,
        status: record.status,
        level: record.level || 1,
        batch: record.batch || "Standard"
      });
    }
  });
  res.json({ success: true });
});

app.post("/api/erp/pay-fee", (req, res) => {
  const { feeId } = req.body;
  const idx = db.fees.findIndex(f => f.id === feeId);
  if (idx !== -1) {
    db.fees[idx].status = "Paid";
    db.fees[idx].paidDate = new Date().toISOString().split("T")[0];
    res.json({ success: true, fee: db.fees[idx] });
  } else {
    res.status(404).json({ success: false, error: "Fee record not found" });
  }
});

// Student Practice Submission & Assignment endpoints
app.post("/api/erp/practice-submit", (req, res) => {
  const { studentId, studentName, assignmentId, assignmentTitle, type, totalSums, correctSums, accuracy, starsEarned, mode } = req.body;
  
  const submissionId = `PS00${db.practiceSubmissions.length + 1}`;
  const newSubmission = {
    id: submissionId,
    studentId,
    studentName,
    assignmentId: assignmentId || "",
    assignmentTitle: assignmentTitle || "Self Speed Practice",
    date: new Date().toISOString().split("T")[0],
    type,
    totalSums: Number(totalSums),
    correctSums: Number(correctSums),
    accuracy: Number(accuracy),
    starsEarned: Number(starsEarned),
    mode: mode || "Self-Practice"
  };

  db.practiceSubmissions.push(newSubmission);

  // Update assignment status if assigned
  if (assignmentId) {
    const assignIdx = db.practiceAssignments.findIndex(a => a.id === assignmentId);
    if (assignIdx !== -1) {
      db.practiceAssignments[assignIdx].completedCount = db.practiceAssignments[assignIdx].sumsCount;
      db.practiceAssignments[assignIdx].starsEarned = Number(starsEarned);
    }
  }

  // Update Leaderboard entry
  const lbIdx = db.leaderboard.findIndex(l => l.studentId === studentId);
  if (lbIdx !== -1) {
    db.leaderboard[lbIdx].stars += Number(starsEarned);
    db.leaderboard[lbIdx].completedCount += 1;
  } else {
    const student = db.students.find(s => s.id === studentId);
    db.leaderboard.push({
      id: `LB00${db.leaderboard.length + 1}`,
      studentId,
      studentName,
      stars: Number(starsEarned),
      level: student ? student.currentLevel : 1,
      completedCount: 1
    });
  }

  // Add a homework completion record for visual trace in Teacher panel
  const scoreLetter = accuracy >= 95 ? "A+" : accuracy >= 85 ? "A" : accuracy >= 70 ? "B" : "C";
  db.homework.push({
    id: `H00${db.homework.length + 1}`,
    studentId,
    week: `Week ${new Date().toISOString().split("T")[0].slice(5, 7)}`,
    task: `Practice: ${assignmentTitle || type} (${totalSums} Sums)`,
    status: "Completed",
    score: `${scoreLetter} (${accuracy}%)`
  });

  res.json({ success: true, submission: newSubmission, leaderboard: db.leaderboard });
});

app.post("/api/erp/practice-assign", (req, res) => {
  const { studentId, studentIds, title, sumsCount, level, dueDate, teacherFocus, digits, rows, type, customSums } = req.body;
  
  const sIds = Array.isArray(studentIds) ? studentIds : (studentId ? [studentId] : []);
  if (sIds.length === 0) {
    return res.status(400).json({ success: false, error: "No target students provided for practice assignment." });
  }

  const created: any[] = [];
  sIds.forEach((sId: string) => {
    const assignmentId = `PA00${db.practiceAssignments.length + 1}`;
    const newAssignment = {
      id: assignmentId,
      studentId: sId,
      title,
      sumsCount: customSums && Array.isArray(customSums) ? customSums.length : (Number(sumsCount) || 30),
      completedCount: 0,
      level: Number(level) || 1,
      dueDate: dueDate || new Date().toISOString().split("T")[0],
      teacherFocus: teacherFocus || "Practice well!",
      digits: Number(digits) || 1,
      rows: Number(rows) || 3,
      type: type || "Addition",
      starsEarned: 0,
      customSums: customSums || null
    };
    db.practiceAssignments.push(newAssignment);
    created.push(newAssignment);
  });

  res.json({ success: true, assignments: created });
});

// Custom Concept-wise Worksheets endpoints
app.get("/api/erp/custom-worksheets", (req, res) => {
  res.json({ success: true, customWorksheets: db.customWorksheets || [] });
});

app.post("/api/erp/custom-worksheets", (req, res) => {
  const { title, level, conceptName, sums, createdByTeacherId, createdByTeacherName, centerId } = req.body;
  const id = `CW00${(db.customWorksheets || []).length + 1}`;
  
  const newWorksheet = {
    id,
    title: title || `Custom Worksheet Level ${level}`,
    level: Number(level) || 1,
    conceptName: conceptName || "General Concept",
    sums: sums || [],
    createdByTeacherId,
    createdByTeacherName,
    centerId,
    createdAt: new Date().toISOString()
  };
  
  if (!db.customWorksheets) {
    db.customWorksheets = [];
  }
  db.customWorksheets.push(newWorksheet);
  saveDb();
  
  res.json({ success: true, worksheet: newWorksheet });
});

app.put("/api/erp/custom-worksheets/:id", (req, res) => {
  const { id } = req.params;
  const { title, level, conceptName, sums } = req.body;
  
  if (!db.customWorksheets) {
    db.customWorksheets = [];
  }
  const idx = db.customWorksheets.findIndex(w => w.id === id);
  if (idx !== -1) {
    db.customWorksheets[idx] = {
      ...db.customWorksheets[idx],
      title: title || db.customWorksheets[idx].title,
      level: level !== undefined ? Number(level) : db.customWorksheets[idx].level,
      conceptName: conceptName || db.customWorksheets[idx].conceptName,
      sums: sums || db.customWorksheets[idx].sums
    };
    saveDb();
    res.json({ success: true, worksheet: db.customWorksheets[idx] });
  } else {
    res.status(404).json({ success: false, error: "Worksheet not found" });
  }
});

app.delete("/api/erp/custom-worksheets/:id", (req, res) => {
  const { id } = req.params;
  
  if (!db.customWorksheets) {
    db.customWorksheets = [];
  }
  const idx = db.customWorksheets.findIndex(w => w.id === id);
  if (idx !== -1) {
    const deleted = db.customWorksheets.splice(idx, 1);
    saveDb();
    res.json({ success: true, worksheet: deleted[0] });
  } else {
    res.status(404).json({ success: false, error: "Worksheet not found" });
  }
});



// ====================
// GEMINI AI ENDPOINTS
// ====================

// 1. Student Progress Report Generator
app.post("/api/gemini/progress-report", async (req, res) => {
  const { studentName, level, attendanceRate, examScore, homeworkRate, speedScore, observations } = req.body;
  try {
    const ai = getGeminiClient();
    const prompt = `
      As a certified Senior Abacus Master Trainer and Pedagogical Coach at Geniplus Academy, generate a professional, parent-friendly and supportive student progress report.
      
      STUDENT METRICS:
      - Student Name: ${studentName}
      - Current Abacus Level: ${level} / 8
      - Attendance Rate: ${attendanceRate}%
      - Average Exam Marks: ${examScore}%
      - Homework Completion: ${homeworkRate}%
      - Speed Test Score: ${speedScore} (Sums per minute)
      - Teacher's Observations: ${observations}

      Your task is to write a constructive, encouraging progress report detailing:
      1. Overall Performance Assessment.
      2. Key Strengths (e.g. Visualization, Speed, Left-brain concentration, Bead dexterity, Accuracy).
      3. Focus Areas for Improvement (Abacus mechanics, Direct addition, Big Friends, Little Friends, or concentration).
      4. Recommendations for Parent Practice at home.
      5. Next Month's Learning Milestones and Action Plan.

      Format the response cleanly with clear section headings. Address the parent warmly but with professional credibility. Keep it structured.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("Gemini progress-report error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Lesson Planner
app.post("/api/gemini/lesson-plan", async (req, res) => {
  const { level, topic, duration } = req.body;
  try {
    const ai = getGeminiClient();
    const prompt = `
      As an Abacus Curriculum Designer, generate a highly detailed and practical Lesson Plan for Abacus teachers at Geniplus Academy.
      
      LESSON META-DATA:
      - Student Level: Level ${level}
      - Topic/Concept: ${topic} (e.g., Big Friend Addition of +9, Multiplication Intro, Advanced Division)
      - Duration: ${duration} Minutes

      Generate a plan with the following structure:
      1. Learning Objectives (Specifically what beads or rules they will master).
      2. Warm-Up Activity (5-10 mins, focus on Speed Practice, Mental Math, or Finger Gym exercises).
      3. Concept Explanation (Step-by-step physical abacus rules explanation, detailing index/thumb movements, bead equations e.g., +9 = +10 - 1).
      4. Guided Practice (Classroom exercises, example sums, and how the teacher should model the bead movements).
      5. Independent Practice (Worksheet questions and Speed Practice timers).
      6. Daily Homework & Review Tasks.
      7. Assessment Method (How to check if the child has learned the core concept before the session ends).

      Provide clear equations and bead instructions so teachers can copy-paste this lesson plan and execute it immediately.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("Gemini lesson-plan error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Parent Counsellor
app.post("/api/gemini/counsel", async (req, res) => {
  const { query } = req.body;
  try {
    const ai = getGeminiClient();
    const prompt = `
      You are the "Geniplus AI Parent Counsellor". You are a world-class authority on cognitive brain development, child psychology, mental arithmetic pedagogy, and Abacus education.
      
      Parents of Abacus students have questions about how Abacus works, its benefits, homework load, how it helps school math, child frustration, speed vs. accuracy, left-right brain coordination, etc.

      PARENT QUERY:
      "${query}"

      Respond to the parent in a warm, comforting, yet authoritative, scientifically-grounded, and empathetic manner. Use metaphors (like brain muscle building, pathways, etc.) where appropriate.
      
      Guidelines:
      - Explain the 'why' (e.g. why visualizing beads builds memory span and spatial processing).
      - Give 2 practical steps the parent can do to support their child.
      - Keep the tone encouraging and positive.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("Gemini counsel error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Marketing Assistant
app.post("/api/gemini/marketing", async (req, res) => {
  const { platform, goal, keywords } = req.body;
  try {
    const ai = getGeminiClient();
    const prompt = `
      You are the "Geniplus Academy Marketing Assistant". Generate professional marketing content for an Abacus Academy.

      PLATFORM/CHANNEL: ${platform} (e.g. Facebook Ad, Instagram Post, WhatsApp Broadcast, Email Campaign)
      CAMPAIGN GOAL: ${goal} (e.g., Increase Summer Camp admissions, Offer Free Trial Demos, Parent Awareness of Mental Arithmetic)
      KEYWORDS/KEY DETAILS: ${keywords}

      Generate highly compelling, high-converting copy that appeals deeply to parents (who want academic success, focus, concentration, confidence, and screen-time reduction for their kids).
      Include:
      1. A hook that grabs interest.
      2. The core benefits (Mastery of mental math, concentration boost, left-brain development).
      3. A strong, urgent Call-to-Action (CTA) suitable for the platform.
      4. Appropriate hashtags, emojis, and styling (e.g. line breaks for readability).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("Gemini marketing error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Sales Coach
app.post("/api/gemini/sales", async (req, res) => {
  const { objection, scenario } = req.body;
  try {
    const ai = getGeminiClient();
    const prompt = `
      You are the "Geniplus Sales & CRM Advisor". Coach center admission staff on how to overcome parent hesitation and convert leads into paid admissions.

      OBJECTION: ${objection} (e.g., "The fees are too high", "My child is too busy with school", "Is Abacus relevant in the calculator/AI era?", "My child is too young")
      SCENARIO / PARENT BACKGROUND: ${scenario}

      Provide a masterclass sales-handling guide:
      1. Empathy & Acknowledgment Response (How to validate the parent's concern first without sounding defensive).
      2. Paradigm Shift / Clarifying Question (How to challenge the objection nicely and open the parent's mind).
      3. High-Value Talk Points (Specific reasons and benefits to explain - e.g., how Abacus is actually physical cognitive training, not just counting; why the expense is an investment in permanent neural connections).
      4. Closing CTA (How to lock in the admission or trial demo right then and there).
      
      Give direct script lines that the sales staff can say over the phone or in person!
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("Gemini sales error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ----------------------------------------
// SaaS FINANCIALS, PROOFS & SUBSCRIPTIONS
// ----------------------------------------

// 1. Center Admin / Teacher records a new tuition fee invoice
app.post("/api/erp/create-fee", (req, res) => {
  const { studentId, month, amount, discount, feeType } = req.body;
  if (!studentId || !month || !amount) {
    return res.status(400).json({ success: false, error: "Missing invoice required parameters" });
  }
  const feeId = `F00${db.fees.length + 1}`;
  const newFee = {
    id: feeId,
    studentId,
    centerId: req.body.centerId || "C001",
    month,
    amount: Number(amount),
    discount: Number(discount) || 0,
    status: "Unpaid" as const,
    paidDate: "",
    feeType: feeType || "Level Fee"
  };
  db.fees.push(newFee);
  res.json({ success: true, fee: newFee });
});

// GET custom fee structure for a center
app.get("/api/erp/fee-structure/:centerId", (req, res) => {
  const { centerId } = req.params;
  let structure = db.feeStructures.find(fs => fs.centerId === centerId);
  if (!structure) {
    // Generate default structure
    structure = {
      centerId,
      registrationFee: 1500,
      levelFee: 2500,
      examFee: 500,
      extraFees: []
    };
    db.feeStructures.push(structure);
  }
  res.json({ success: true, feeStructure: structure });
});

// POST save/update fee structure for a center
app.post("/api/erp/fee-structure", (req, res) => {
  const { centerId, registrationFee, levelFee, examFee, extraFees } = req.body;
  if (!centerId) {
    return res.status(400).json({ success: false, error: "Missing center ID" });
  }
  let index = db.feeStructures.findIndex(fs => fs.centerId === centerId);
  const updatedStructure = {
    centerId,
    registrationFee: Number(registrationFee) || 0,
    levelFee: Number(levelFee) || 0,
    examFee: Number(examFee) || 0,
    extraFees: Array.isArray(extraFees) ? extraFees : []
  };

  if (index !== -1) {
    db.feeStructures[index] = updatedStructure;
  } else {
    db.feeStructures.push(updatedStructure);
  }
  res.json({ success: true, feeStructure: updatedStructure });
});

// 2. Student / Parent submits fee payment proof (bank/UPI screenshot reference)
app.post("/api/erp/submit-fee-proof", (req, res) => {
  const { feeId, referenceNumber, paymentMethod, proofScreenshot } = req.body;
  const foundFee = db.fees.find(f => f.id === feeId);
  if (!foundFee) {
    return res.status(404).json({ success: false, error: "Fee invoice not found" });
  }
  
  foundFee.status = "Pending Approval";
  foundFee.referenceNumber = referenceNumber || "REF-" + Math.floor(100000 + Math.random() * 900000);
  foundFee.paymentMethod = paymentMethod || "UPI Transfer";
  foundFee.proofScreenshot = proofScreenshot || "/placeholder-screenshot.png";
  foundFee.proofSubmittedDate = new Date().toISOString().split("T")[0];
  
  res.json({ success: true, fee: foundFee });
});

// 3. Center Admin approves or declines a submitted payment proof
app.post("/api/erp/approve-fee", (req, res) => {
  const { feeId, action, feedback } = req.body; // action: "Approve" | "Reject"
  const foundFee = db.fees.find(f => f.id === feeId);
  if (!foundFee) {
    return res.status(404).json({ success: false, error: "Fee invoice not found" });
  }

  if (action === "Approve") {
    foundFee.status = "Paid";
    foundFee.paidDate = new Date().toISOString().split("T")[0];
    foundFee.feedback = "Payment confirmed. Receipt issued successfully.";
  } else {
    foundFee.status = "Unpaid";
    foundFee.feedback = feedback || "Proof is unclear or reference was invalid. Please re-submit.";
    foundFee.proofScreenshot = undefined;
    foundFee.referenceNumber = undefined;
  }

  res.json({ success: true, fee: foundFee });
});

// DELETE/Remove fee invoice (Center Admin correction)
app.post("/api/erp/delete-fee", (req, res) => {
  const { feeId } = req.body;
  const index = db.fees.findIndex(f => f.id === feeId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Fee invoice not found" });
  }
  const removed = db.fees.splice(index, 1)[0];
  res.json({ success: true, feeId: removed.id });
});

// 4. Super Admin manages center subscriptions & trial periods
app.post("/api/erp/update-subscription", (req, res) => {
  const { centerId, plan, subscriptionExpiry, isTrial, trialDays } = req.body;
  const center = db.centers.find(c => c.id === centerId);
  if (!center) {
    return res.status(404).json({ success: false, error: "Center not found" });
  }

  if (plan !== undefined) center.plan = plan;
  if (subscriptionExpiry !== undefined) center.subscriptionExpiry = subscriptionExpiry;
  if (isTrial !== undefined) center.isTrial = isTrial;
  if (trialDays !== undefined) {
    center.trialDays = Number(trialDays);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + Number(trialDays));
    center.trialExpiryDate = expiry.toISOString().split("T")[0];
  }

  res.json({ success: true, center });
});

// 5. Update student batch assignment
app.post("/api/erp/update-student-batch", (req, res) => {
  const { studentId, batch } = req.body;
  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ success: false, error: "Student not found" });
  }
  student.batch = batch;
  res.json({ success: true, student });
});

// 6. Update student learning level
app.post("/api/erp/update-student-level", (req, res) => {
  const { studentId, level } = req.body;
  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ success: false, error: "Student not found" });
  }
  student.currentLevel = Number(level);
  res.json({ success: true, student });
});

// 6a. Update teacher role/designation
app.post("/api/erp/update-teacher-role", (req, res) => {
  const { teacherId, role } = req.body;
  const teacher = db.teachers.find(t => t.id === teacherId);
  if (!teacher) {
    return res.status(404).json({ success: false, error: "Teacher not found" });
  }
  teacher.role = role;
  res.json({ success: true, teacher });
});

// 6b. Update student-teacher assignment
app.post("/api/erp/update-student-teacher", (req, res) => {
  const { studentId, teacherId } = req.body;
  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ success: false, error: "Student not found" });
  }
  student.teacherId = teacherId;
  res.json({ success: true, student });
});

// 6c. Update center payment details (UPI QR, UPI ID, Bank Details)
app.post("/api/erp/update-payment-details", (req, res) => {
  const { centerId, upiId, bankDetails, qrCode } = req.body;
  const center = db.centers.find(c => c.id === centerId);
  if (!center) {
    return res.status(404).json({ success: false, error: "Center not found" });
  }
  center.upiId = upiId;
  center.bankDetails = bankDetails;
  center.qrCode = qrCode;
  res.json({ success: true, center });
});

// 6d. Send student dashboard in-app notification
app.post("/api/erp/send-student-notification", (req, res) => {
  const { studentId, title, message } = req.body;
  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ success: false, error: "Student not found" });
  }
  if (!student.notifications) {
    student.notifications = [];
  }
  student.notifications.unshift({
    id: `N${Date.now()}`,
    title,
    message,
    date: new Date().toISOString().split("T")[0],
    read: false
  });
  res.json({ success: true, student });
});


// 7. Super Admin updates Center Tenant details
app.post("/api/erp/edit-center", (req, res) => {
  const { id, name, ownerName, email, mobile, plan, status, password, customPrice, addresses } = req.body;
  const targetId = id || req.body.centerId;
  const center = db.centers.find(c => c.id === targetId);
  if (!center) {
    return res.status(404).json({ success: false, error: "Center not found" });
  }

  if (name !== undefined) center.name = name;
  if (ownerName !== undefined) center.ownerName = ownerName;
  if (email !== undefined) center.email = email;
  if (mobile !== undefined) center.mobile = mobile;
  if (plan !== undefined) center.plan = plan;
  if (status !== undefined) center.status = status;
  if (password !== undefined) center.password = password;
  if (customPrice !== undefined) center.customPrice = customPrice;
  if (addresses !== undefined) center.addresses = addresses;

  res.json({ success: true, center });
});

// 8. Super Admin deletes a Center Tenant account
app.post("/api/erp/delete-center", (req, res) => {
  const { id, centerId } = req.body;
  const targetId = id || centerId;
  const idx = db.centers.findIndex(c => c.id === targetId);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: "Center not found" });
  }
  const removed = db.centers.splice(idx, 1)[0];
  res.json({ success: true, id: removed.id });
});

// 8a. Delete teacher/staff (Center head removes staff)
app.post("/api/erp/delete-teacher", (req, res) => {
  const { teacherId } = req.body;
  const idx = db.teachers.findIndex(t => t.id === teacherId);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: "Teacher not found" });
  }
  const removed = db.teachers.splice(idx, 1)[0];
  res.json({ success: true, teacherId: removed.id });
});

// 8b. Update student active/inactive status (Teacher manages student active state)
app.post("/api/erp/update-student-status", (req, res) => {
  const { studentId, status } = req.body;
  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ success: false, error: "Student not found" });
  }
  student.status = status || "Active";
  res.json({ success: true, student });
});

// 9. Unified profile editor (Name, Password, Base64 profile photo)
app.post("/api/erp/update-profile", (req, res) => {
  const { email, role, name, password, photo } = req.body;
  let updated = false;
  let updatedUser: any = null;

  const normalizedEmail = email.trim().toLowerCase();

  if (role === "Super Admin") {
    const admin = db.admins.find(a => a.email.toLowerCase() === normalizedEmail);
    if (admin) {
      if (name) admin.name = name;
      if (password) admin.password = password;
      if (photo !== undefined) admin.photo = photo;
      updated = true;
      updatedUser = admin;
    }
  } else if (role === "Center Admin") {
    const center = db.centers.find(c => c.email.toLowerCase() === normalizedEmail);
    if (center) {
      if (name) center.ownerName = name;
      if (password) center.password = password;
      if (photo !== undefined) center.photo = photo;
      updated = true;
      updatedUser = { ...center, name: center.ownerName };
    }
  } else if (role === "Teacher") {
    const teacher = db.teachers.find(t => t.email.toLowerCase() === normalizedEmail);
    if (teacher) {
      if (name) teacher.name = name;
      if (password) teacher.password = password;
      if (photo !== undefined) teacher.photo = photo;
      updated = true;
      updatedUser = teacher;
    }
  } else if (role === "Student") {
    const student = db.students.find(s => s.email.toLowerCase() === normalizedEmail);
    if (student) {
      if (name) student.studentName = name;
      if (password) student.password = password;
      if (photo !== undefined) student.photo = photo;
      updated = true;
      updatedUser = { ...student, name: student.studentName };
    }
  }

  if (updated) {
    res.json({ success: true, user: updatedUser });
  } else {
    res.status(404).json({ success: false, error: "User profile not found in system databases." });
  }
});

// 10. Self-service password recovery flow
app.post("/api/erp/forgot-password", (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, error: "Email ID and new password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let found = false;

  // Search admins
  const admin = db.admins?.find(a => a.email.toLowerCase() === normalizedEmail);
  if (admin) {
    admin.password = newPassword;
    found = true;
  }

  // Search centers
  if (!found) {
    const center = db.centers.find(c => c.email.toLowerCase() === normalizedEmail);
    if (center) {
      center.password = newPassword;
      found = true;
    }
  }

  // Search teachers
  if (!found) {
    const teacher = db.teachers.find(t => t.email.toLowerCase() === normalizedEmail);
    if (teacher) {
      teacher.password = newPassword;
      found = true;
    }
  }

  // Search students
  if (!found) {
    const student = db.students.find(s => s.email.toLowerCase() === normalizedEmail);
    if (student) {
      student.password = newPassword;
      found = true;
    }
  }

  if (found) {
    res.json({ success: true, message: "Your password has been successfully reset! You can now log in." });
  } else {
    res.status(404).json({ success: false, error: "We couldn't find a Geniplus account registered under this email ID." });
  }
});


// Vite middleware or static serving & bootstrap
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Geniplus Academy ERP Server listening on port ${PORT}`);
  });
}

bootstrap();
