import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

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

// Global In-Memory multi-tenant store
const db: { [key: string]: any[] } = {
  centers: [
    { id: "C001", name: "Geniplus Bangalore East", ownerName: "Rajesh Kumar", mobile: "+91 98765 43210", email: "rajesh.east@geniplus.com", city: "Bangalore", state: "Karnataka", country: "India", plan: "Premium", subscriptionStart: "2026-01-15", subscriptionExpiry: "2027-01-15", status: "Active" },
    { id: "C002", name: "Geniplus Mumbai West", ownerName: "Anjali Shah", mobile: "+91 91234 56789", email: "anjali.west@geniplus.com", city: "Mumbai", state: "Maharashtra", country: "India", plan: "Standard", subscriptionStart: "2026-02-10", subscriptionExpiry: "2027-02-10", status: "Active" },
    { id: "C003", name: "Geniplus Delhi Central", ownerName: "Amit Sharma", mobile: "+91 88888 77777", email: "amit.delhi@geniplus.com", city: "New Delhi", state: "Delhi", country: "India", plan: "Basic", subscriptionStart: "2026-03-01", subscriptionExpiry: "2026-09-01", status: "Active" }
  ],
  teachers: [
    { id: "T001", centerId: "C001", name: "Sunitha Rao", email: "sunitha@geniplus.com", mobile: "+91 99001 12233", joiningDate: "2026-01-20", role: "Senior Abacus Trainer", status: "Active", password: "password123" },
    { id: "T002", centerId: "C001", name: "Meera Nair", email: "meera@geniplus.com", mobile: "+91 99002 23344", joiningDate: "2026-02-01", role: "Junior Teacher", status: "Active", password: "password123" },
    { id: "T003", centerId: "C002", name: "Ketan Mehta", email: "ketan@geniplus.com", mobile: "+91 98111 22233", joiningDate: "2026-02-15", role: "Head Coach", status: "Active", password: "password123" }
  ],
  students: [
    { id: "S001", centerId: "C001", teacherId: "T001", studentName: "Aarav Rajesh", parentName: "Rajesh Kumar", parentMobile: "+91 98765 43210", dateOfBirth: "2018-05-12", age: 8, school: "Greenwood High", currentLevel: 2, batch: "Sat 10:00 AM", joiningDate: "2026-01-18", status: "Active", email: "aarav@gmail.com", password: "password123" },
    { id: "S002", centerId: "C001", teacherId: "T001", studentName: "Ananya Pillai", parentName: "Hari Pillai", parentMobile: "+91 98450 12345", dateOfBirth: "2017-09-23", age: 9, school: "Delhi Public School", currentLevel: 3, batch: "Sat 10:00 AM", joiningDate: "2026-01-22", status: "Active", email: "ananya@gmail.com", password: "password123" },
    { id: "S003", centerId: "C001", teacherId: "T002", studentName: "Rohan Das", parentName: "Sanjay Das", parentMobile: "+91 98451 98765", dateOfBirth: "2019-11-05", age: 6, school: "National Public School", currentLevel: 1, batch: "Sun 11:30 AM", joiningDate: "2026-02-05", status: "Active", email: "rohan@gmail.com", password: "password123" },
    { id: "S004", centerId: "C002", teacherId: "T003", studentName: "Vihaan Shah", parentName: "Anjali Shah", parentMobile: "+91 91234 56789", dateOfBirth: "2018-01-30", age: 8, school: "Podar International", currentLevel: 2, batch: "Sat 2:00 PM", joiningDate: "2026-02-12", status: "Active", email: "vihaan@gmail.com", password: "password123" }
  ],
  leads: [
    { id: "L001", centerId: "C001", name: "Kabir Mehra", parentName: "Vikram Mehra", parentMobile: "+91 97777 66666", source: "Facebook Ad", campaign: "Summer Abacus Camps", counsellor: "Neha Verma", status: "Demo Scheduled", date: "2026-07-01", remarks: "Interested in weekend batch. Scheduled demo for Sat 11am." },
    { id: "L002", centerId: "C001", name: "Siddharth Sen", parentName: "Rina Sen", parentMobile: "+91 96666 55555", source: "Google Search", campaign: "Direct Search", counsellor: "Neha Verma", status: "New Lead", date: "2026-07-03", remarks: "Enquired about level 1 fees and age suitability." },
    { id: "L003", centerId: "C001", name: "Riya Patel", parentName: "Darshan Patel", parentMobile: "+91 95555 44444", source: "Referral", campaign: "Friend Referral Plan", counsellor: "Neha Verma", status: "Admission Confirmed", date: "2026-06-28", remarks: "Joined level 1 with discount. Paid admission fee." },
    { id: "L004", centerId: "C002", name: "Nisha Gore", parentName: "Suhas Gore", parentMobile: "+91 94444 33333", source: "Instagram Post", campaign: "Mental Math Mastery", counsellor: "Rahul Deshmukh", status: "Contacted", date: "2026-07-02", remarks: "Call answered, child is 7 yrs. Will check with father and get back." }
  ],
  attendance: [
    { studentId: "S001", date: "2026-07-04", status: "Present", level: 2, batch: "Sat 10:00 AM" },
    { studentId: "S002", date: "2026-07-04", status: "Present", level: 3, batch: "Sat 10:00 AM" },
    { studentId: "S003", date: "2026-07-05", status: "Absent", level: 1, batch: "Sun 11:30 AM" },
    { studentId: "S001", date: "2026-06-27", status: "Present", level: 2, batch: "Sat 10:00 AM" },
    { studentId: "S002", date: "2026-06-27", status: "Present", level: 3, batch: "Sat 10:00 AM" },
    { studentId: "S003", date: "2026-06-28", status: "Present", level: 1, batch: "Sun 11:30 AM" }
  ],
  fees: [
    { id: "F001", studentId: "S001", centerId: "C001", month: "July 2026", amount: 2500, status: "Paid", paidDate: "2026-07-02", discount: 0 },
    { id: "F002", studentId: "S002", centerId: "C001", month: "July 2026", amount: 2500, status: "Unpaid", paidDate: "", discount: 0 },
    { id: "F003", studentId: "S003", centerId: "C001", month: "July 2026", amount: 2500, status: "Paid", paidDate: "2026-07-03", discount: 500 },
    { id: "F004", studentId: "S004", centerId: "C002", month: "July 2026", amount: 2800, status: "Unpaid", paidDate: "", discount: 0 }
  ],
  feeStructures: [
    {
      centerId: "C001",
      registrationFee: 1500,
      levelFee: 2500,
      examFee: 500,
      extraFees: [
        { id: "X001", name: "National Abacus Competition 2026", amount: 1000 },
        { id: "X002", name: "Annual Day Event Kit", amount: 600 }
      ]
    },
    {
      centerId: "C002",
      registrationFee: 1800,
      levelFee: 2800,
      examFee: 600,
      extraFees: [
        { id: "X003", name: "State Level Championship Fee", amount: 1200 }
      ]
    }
  ],
  expenses: [
    { id: "E001", centerId: "C001", category: "Rent", amount: 15000, date: "2026-07-01", description: "Monthly Center Office Rent" },
    { id: "E002", centerId: "C001", category: "Salary", amount: 12000, date: "2026-07-05", description: "Teacher Sunitha Rao Salary" },
    { id: "E003", centerId: "C001", category: "Marketing", amount: 4500, date: "2026-07-02", description: "Facebook Ads July Campaign" },
    { id: "E004", centerId: "C001", category: "Utilities", amount: 2200, date: "2026-07-04", description: "Electricity and Broadband Connection" }
  ],
  homework: [
    { id: "H001", studentId: "S001", week: "Week 27", task: "Level 2: Big Friend Addition (+9, +8) - Pages 12 to 14", status: "Completed", score: "A" },
    { id: "H002", studentId: "S002", week: "Week 27", task: "Level 3: Double Digit Addition - 3 Rows (Flash Practice)", status: "Completed", score: "B+" },
    { id: "H003", studentId: "S003", week: "Week 27", task: "Level 1: Direct Bead Addition 1-4, Worksheet 3", status: "Incomplete", score: "N/A" }
  ],
  exams: [
    { id: "EX001", studentId: "S001", examName: "Unit 1 Test (Level 2)", date: "2026-06-20", score: 85, maxScore: 100, certificate: "Yes", feedback: "Very good at direct bead sums. Speed is fine, but needs practice in Big Friends." },
    { id: "EX002", studentId: "S002", examName: "Monthly Exam (Level 3)", date: "2026-06-25", score: 92, maxScore: 100, certificate: "Yes", feedback: "Excellent Speed Test results. Keep it up!" }
  ],
  practiceAssignments: [
    { id: "PA001", studentId: "S001", title: "Daily Division Challenge", sumsCount: 30, completedCount: 22, level: 2, dueDate: "2026-07-07", teacherFocus: "Excellent rhythm. Add one division round after revision.", digits: 2, rows: 1, type: "Division", starsEarned: 63 },
    { id: "PA002", studentId: "S001", title: "Double Digit Speed Run", sumsCount: 20, completedCount: 10, level: 2, dueDate: "2026-07-08", teacherFocus: "Concentrate on thumb movements for bottom beads.", digits: 2, rows: 3, type: "Addition", starsEarned: 35 },
    { id: "PA003", studentId: "S002", title: "Big Friend Subtraction", sumsCount: 30, completedCount: 30, level: 3, dueDate: "2026-07-07", teacherFocus: "Keep fingers close to the beam for maximum speed.", digits: 2, rows: 4, type: "Subtraction", starsEarned: 90 },
    { id: "PA004", studentId: "S003", title: "Direct Bead Fundamentals", sumsCount: 15, completedCount: 15, level: 1, dueDate: "2026-07-07", teacherFocus: "Focus on zero-recenter accuracy.", digits: 1, rows: 3, type: "Addition", starsEarned: 45 }
  ],
  practiceSubmissions: [
    { id: "PS001", studentId: "S001", studentName: "Aarav Rajesh", assignmentId: "PA001", assignmentTitle: "Daily Division Challenge", date: "2026-07-06", type: "Division", totalSums: 10, correctSums: 9, accuracy: 90, starsEarned: 30, mode: "Assigned" },
    { id: "PS002", studentId: "S002", studentName: "Ananya Pillai", assignmentId: "PA003", assignmentTitle: "Big Friend Subtraction", date: "2026-07-07", type: "Subtraction", totalSums: 30, correctSums: 30, accuracy: 100, starsEarned: 90, mode: "Assigned" },
    { id: "PS003", studentId: "S003", studentName: "Rohan Das", assignmentId: "PA004", assignmentTitle: "Direct Bead Fundamentals", date: "2026-07-07", type: "Addition", totalSums: 15, correctSums: 12, accuracy: 80, starsEarned: 45, mode: "Assigned" }
  ],
  leaderboard: [
    { id: "LB001", studentId: "S001", studentName: "Aarav Rajesh", stars: 185, level: 2, completedCount: 14 },
    { id: "LB002", studentId: "S002", studentName: "Ananya Pillai", stars: 240, level: 3, completedCount: 20 },
    { id: "LB003", studentId: "S003", studentName: "Rohan Das", stars: 95, level: 1, completedCount: 8 },
    { id: "LB004", studentId: "S004", studentName: "Vihaan Shah", stars: 120, level: 2, completedCount: 11 }
  ]
};

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
  const { studentId, studentIds, title, sumsCount, level, dueDate, teacherFocus, digits, rows, type } = req.body;
  
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
      sumsCount: Number(sumsCount) || 30,
      completedCount: 0,
      level: Number(level) || 1,
      dueDate: dueDate || new Date().toISOString().split("T")[0],
      teacherFocus: teacherFocus || "Practice well!",
      digits: Number(digits) || 1,
      rows: Number(rows) || 3,
      type: type || "Addition",
      starsEarned: 0
    };
    db.practiceAssignments.push(newAssignment);
    created.push(newAssignment);
  });

  res.json({ success: true, assignments: created });
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
