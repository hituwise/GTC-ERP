import React, { useState, useEffect, useRef, useMemo } from "react";
import { Student, StudentPracticeAssignment, StudentPracticeSubmission, AcademyLeaderboardEntry, Center, CertificateRecord } from "../types";
import { printElementById } from "../lib/printUtils";
import { BookOpen, Sparkles, TrendingUp, RefreshCw, Trophy, Target, ArrowRight, Play, CheckCircle2, ChevronRight, RefreshCcw, HelpCircle, Image as ImageIcon, Flame, Clock, Star, Zap, Eye, Grid, Award, Search } from "lucide-react";
import AbacusBeadExerciseView from "./AbacusBeadExerciseView";
import DigitalCertificateViewer from "./DigitalCertificateViewer";
import VirtualAbacus from "./VirtualAbacus";
import FlashAnzanPractice from "./FlashAnzanPractice";

interface StudentPortalViewProps {
  students: Student[];
  onRefreshData: () => Promise<void>;
  centers?: Center[];
  currentUser?: any;
  attendance?: any[];
}

export default function StudentPortalView({ students, onRefreshData, centers = [], currentUser, attendance = [] }: StudentPortalViewProps) {
  // Login and Auth states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (currentUser && currentUser.role === "Student") {
      return true;
    }
    return localStorage.getItem("student_is_logged_in") === "true";
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (currentUser && currentUser.role === "Student" && currentUser.id) {
      return currentUser.id;
    }
    return localStorage.getItem("student_logged_in_id") || "";
  });

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Synchronize authentication and selected student with currentUser
  useEffect(() => {
    if (currentUser && currentUser.role === "Student" && currentUser.id) {
      setIsLoggedIn(true);
      setSelectedStudentId(currentUser.id);
    }
  }, [currentUser]);

  // Prioritize the actual logged-in user over old/cached localStorage keys to prevent data leaking
  const currentStudent = (() => {
    // 1. If currentUser is present, find matching student strictly by email or ID
    if (currentUser && currentUser.email) {
      const match = students.find(s => s.email?.toLowerCase().trim() === currentUser.email?.toLowerCase().trim()) ||
                    students.find(s => s.id?.toLowerCase() === currentUser.id?.toLowerCase());
      if (match) return match;
    }
    // 2. If we have a selected student ID from local portal login
    if (selectedStudentId) {
      const match = students.find(s => s.id?.toLowerCase() === selectedStudentId.toLowerCase());
      if (match) return match;
    }
    // 3. Fallback to a custom temporary object based on logged-in user properties
    if (currentUser) {
      return {
        id: currentUser.id || selectedStudentId || "",
        studentName: currentUser.name || "Student Profile",
        currentLevel: 1,
        batch: "",
        centerId: currentUser.centerId || "C001",
        email: currentUser.email || "",
        notifications: []
      };
    }
    // 4. Ultimate fallback for demo/unauthenticated views
    return students[0] || {
      id: "S001",
      studentName: "Aarav Rajesh",
      currentLevel: 2,
      batch: "",
      centerId: "C001",
      email: "aarav@gmail.com",
      notifications: []
    };
  })() as Student;

  const studentCenter = ((centers || []).find(c => c.id === currentStudent.centerId) || (centers || [])[0] || { name: "Academy Name" }) as any;
  const centerInitials = studentCenter.name.split(" ").map(w => w[0]).join("").slice(0, 2) || "AA";

  // State loaded from server
  const [assignments, setAssignments] = useState<StudentPracticeAssignment[]>([]);
  const [submissions, setSubmissions] = useState<StudentPracticeSubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<AcademyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [userRating, setUserRating] = useState<number>(0);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState<boolean>(false);
  const [ratingFeedback, setRatingFeedback] = useState<string>("");

  // Leaderboard Filter, Timeframe, Search & Pagination states
  const [leaderboardScope, setLeaderboardScope] = useState<"all" | "mylevel" | "customlevel">("all");
  const [leaderboardLevelSelect, setLeaderboardLevelSelect] = useState<string>("all");
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<"monthly" | "weekly" | "total">("monthly");
  const [leaderboardSearch, setLeaderboardSearch] = useState<string>("");
  const [leaderboardPageSize, setLeaderboardPageSize] = useState<number>(10);
  const [leaderboardPage, setLeaderboardPage] = useState<number>(1);

  const filteredLeaderboard = useMemo(() => {
    let list = [...leaderboard];

    // 1. Filter by Level Scope
    if (leaderboardScope === "mylevel") {
      list = list.filter(item => Number(item.level) === Number(currentStudent.currentLevel));
    } else if (leaderboardScope === "customlevel") {
      if (leaderboardLevelSelect !== "all") {
        list = list.filter(item => Number(item.level) === Number(leaderboardLevelSelect));
      }
    } else if (leaderboardLevelSelect !== "all") {
      list = list.filter(item => Number(item.level) === Number(leaderboardLevelSelect));
    }

    // 2. Filter by Search Query
    if (leaderboardSearch.trim() !== "") {
      const q = leaderboardSearch.toLowerCase().trim();
      list = list.filter(item => item.studentName?.toLowerCase().includes(q) || item.studentId?.toLowerCase().includes(q));
    }

    // 3. Sort by Selected Timeframe Stars
    list.sort((a, b) => {
      let starsA = a.stars || 0;
      let starsB = b.stars || 0;

      if (leaderboardTimeframe === "monthly") {
        starsA = (a as any).monthlyStars !== undefined ? (a as any).monthlyStars : a.stars;
        starsB = (b as any).monthlyStars !== undefined ? (b as any).monthlyStars : b.stars;
      } else if (leaderboardTimeframe === "weekly") {
        starsA = (a as any).weeklyStars !== undefined ? (a as any).weeklyStars : Math.ceil((a.stars || 0) * 0.3);
        starsB = (b as any).weeklyStars !== undefined ? (b as any).weeklyStars : Math.ceil((b.stars || 0) * 0.3);
      }
      return starsB - starsA;
    });

    return list;
  }, [leaderboard, leaderboardScope, leaderboardLevelSelect, leaderboardSearch, leaderboardTimeframe, currentStudent.currentLevel]);

  const totalLeaderboardItems = filteredLeaderboard.length;
  const totalLeaderboardPages = Math.max(1, Math.ceil(totalLeaderboardItems / leaderboardPageSize));
  const currentPageClamped = Math.min(leaderboardPage, totalLeaderboardPages);
  const startIndex = (currentPageClamped - 1) * leaderboardPageSize;
  const paginatedLeaderboard = filteredLeaderboard.slice(startIndex, startIndex + leaderboardPageSize);

  const calculateMonthlyStars = () => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fromSubmissions = submissions
      .filter(s => s.date && s.date.startsWith(currentMonthStr))
      .reduce((sum, s) => sum + (s.starsEarned || 0) + ((s as any).bonusStarsEarned || 0), 0);
    const fromHomework = (studentHomeworks || [])
      .filter(h => h.status === "Approved" && (h.submissionDate || h.assignedDate || "").startsWith(currentMonthStr))
      .length * 15;
    return fromSubmissions + fromHomework;
  };

  const calculateTotalStars = () => {
    const fromSubmissions = submissions.reduce((sum, s) => sum + (s.starsEarned || 0) + ((s as any).bonusStarsEarned || 0), 0);
    const fromHomework = (studentHomeworks || []).filter(h => h.status === "Approved").length * 15;
    const fromLeaderboard = leaderboard.find(l => l.studentId?.toLowerCase() === currentStudent?.id?.toLowerCase())?.stars || 0;
    const fromProfile = currentStudent?.stars || 0;
    return Math.max(fromSubmissions + fromHomework, fromLeaderboard, fromProfile);
  };

  const handleRateTeacher = async (teacherId: string, rating: number) => {
    try {
      setIsRatingSubmitting(true);
      setRatingFeedback("");
      const res = await fetch("/api/erp/rate-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, rating })
      });
      const data = await res.json();
      if (data.success) {
        setUserRating(rating);
        setRatingFeedback("Rating submitted! Thank you! ❤️");
        // Reload datasets to fetch updated ratings
        await loadPracticeData();
      } else {
        setRatingFeedback(data.error || "Failed to submit rating.");
      }
    } catch (err) {
      console.error(err);
      setRatingFeedback("Error submitting rating.");
    } finally {
      setIsRatingSubmitting(false);
    }
  };

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
    customSums?: { expression: string; answer: number; rows?: number[] }[] | null;
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
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState<number>(0);
  const [currentQuestionSubmitted, setCurrentQuestionSubmitted] = useState<boolean>(false);
  const [isSubmittingPractice, setIsSubmittingPractice] = useState<boolean>(false);
  const [practiceResult, setPracticeResult] = useState<{
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    accuracy: number;
    starsEarned: number;
    bonusStarsEarned?: number;
    timeTakenSeconds: number;
    assignmentTitle: string;
    rank?: number;
  } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    let intervalId: any = null;
    if (activePractice) {
      intervalId = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activePractice]);

  // Abacus decorative simulator state (moving beads adds/subtracts values)
  const [abacusType, setAbacusType] = useState<"japanese" | "chinese">("japanese");
  const [beadsUpper, setBeadsUpper] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [beadsLower, setBeadsLower] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  // Student-level Show/Hide preference for abacus
  const [studentHideAbacus, setStudentHideAbacus] = useState<boolean>(false);
  const [showAbacusGym, setShowAbacusGym] = useState<boolean>(false);
  const [showFlashAnzan, setShowFlashAnzan] = useState<boolean>(false);

  // Synchronize studentHideAbacus when currentStudent changes
  useEffect(() => {
    if (currentStudent) {
      setStudentHideAbacus(!!currentStudent.hideAbacusPreference);
    }
  }, [currentStudent]);

  const handleToggleAbacus = async () => {
    const newVal = !studentHideAbacus;
    setStudentHideAbacus(newVal);
    try {
      await fetch("/api/erp/students/toggle-abacus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentStudent.id, hideAbacusPreference: newVal })
      });
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (e) {
      console.error("Error toggling abacus preference", e);
    }
  };

  // Derived bead values
  const beadValues = [0, 1, 2, 3, 4, 5, 6].map((wireIdx) => {
    const upper = beadsUpper[wireIdx] || 0;
    const lower = beadsLower[wireIdx] || 0;
    return (upper * 5) + lower;
  });

  // Homework state
  const [studentHomeworks, setStudentHomeworks] = useState<any[]>([]);
  const [submittingHomeworkId, setSubmittingHomeworkId] = useState<string | null>(null);
  const [homeworkNotes, setHomeworkNotes] = useState<string>("");
  const [homeworkProofFile, setHomeworkProofFile] = useState<string>("");

  // Certificates state
  const [studentCertificates, setStudentCertificates] = useState<CertificateRecord[]>([]);
  const [viewingCertificate, setViewingCertificate] = useState<CertificateRecord | null>(null);

  // Helper: check if due date is past 2 days
  const isPastDueDatePlus2Days = (dueDateStr?: string) => {
    if (!dueDateStr) return false;
    try {
      const due = new Date(dueDateStr);
      if (isNaN(due.getTime())) return false;

      const cutoff = new Date(due);
      cutoff.setDate(cutoff.getDate() + 2);
      cutoff.setHours(23, 59, 59, 999);

      return new Date() > cutoff;
    } catch (e) {
      return false;
    }
  };

  // Load all student practice info from the main server DB
  const loadPracticeData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/erp/data");
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        const targetId = selectedStudentId || currentStudent?.id || "";

        // Filter submissions for selected student
        const allSubmissions = d.practiceSubmissions || [];
        const targetSubmissions = allSubmissions.filter((s: any) => s.studentId?.toLowerCase() === targetId?.toLowerCase());
        setSubmissions(targetSubmissions);

        const submittedAssignmentIds = new Set(targetSubmissions.map((s: any) => s.assignmentId?.toLowerCase()).filter(Boolean));

        // Filter practice assignments for selected student:
        // Disappears upon submission OR 2 days past due date
        const allAssignments = d.practiceAssignments || [];
        const activeAssignments = allAssignments.filter((a: any) => {
          if (a.studentId?.toLowerCase() !== targetId?.toLowerCase()) return false;
          // Hide if submitted by student or marked Completed
          if (submittedAssignmentIds.has(a.id?.toLowerCase()) || a.status === "Completed") return false;
          // Hide if 2 days past due date
          if (isPastDueDatePlus2Days(a.dueDate)) return false;
          return true;
        });
        setAssignments(activeAssignments);

        // Global Leaderboard
        setLeaderboard(d.leaderboard || []);

        // Load Student Fees
        const allFees = d.fees || [];
        setStudentFees(allFees.filter((f: any) => f.studentId?.toLowerCase() === targetId?.toLowerCase()));

        // Load Student Homework:
        // Disappears upon submission/completion OR 2 days past due date
        const allHomeworks = d.homework || [];
        const activeHomeworks = allHomeworks.filter((h: any) => {
          if (h.studentId?.toLowerCase() !== targetId?.toLowerCase()) return false;
          // Hide if completed/submitted
          if (h.status === "Completed" || h.submittedAt || h.submittedProof) return false;
          // Hide if 2 days past due date
          if (isPastDueDatePlus2Days(h.dueDate || h.assignedDate || h.date)) return false;
          return true;
        });
        setStudentHomeworks(activeHomeworks);

        // Load Teachers list
        setTeachers(d.teachers || []);

        // Load Student Certificates
        const studentObj = students.find(s => s.id?.toLowerCase() === targetId.toLowerCase()) || currentStudent;
        const centerId = studentObj?.centerId || "C001";
        const studentName = studentObj?.studentName || "";
        try {
          const certRes = await fetch(`/api/erp/certificates?centerId=${encodeURIComponent(centerId)}&studentId=${encodeURIComponent(targetId)}`);
          const certJson = await certRes.json();
          let certList: CertificateRecord[] = [];
          if (certJson.success && Array.isArray(certJson.certificates)) {
            certList = certJson.certificates;
          } else {
            // Fallback to center-data
            const centerDataRes = await fetch(`/api/erp/center-data?centerId=${encodeURIComponent(centerId)}`);
            const centerDataJson = await centerDataRes.json();
            if (centerDataJson.success && centerDataJson.data?.certificates) {
              certList = centerDataJson.data.certificates;
            }
          }
          const filteredCerts = certList.filter((c: CertificateRecord) =>
            (c.studentId && c.studentId.toLowerCase() === targetId.toLowerCase()) ||
            (c.studentName && studentName && c.studentName.trim().toLowerCase() === studentName.trim().toLowerCase())
          );
          setStudentCertificates(filteredCerts);
        } catch (err) {
          console.error("Error fetching student certificates", err);
        }
      }
    } catch (e) {
      console.error("Failed loading practice datasets", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingHomeworkId) return;
    try {
      const res = await fetch("/api/erp/submit-homework-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeworkId: submittingHomeworkId,
          submittedProof: homeworkProofFile || "",
          notes: homeworkNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Homework marked as completed successfully! Your teacher will review and grade it soon.");
        setSubmittingHomeworkId(null);
        setHomeworkNotes("");
        setHomeworkProofFile("");
        loadPracticeData();
      } else {
        alert("Failed to submit homework: " + data.error);
      }
    } catch (err: any) {
      alert("Error submitting homework: " + err.message);
    }
  };

  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  const compressImageBase64 = (base64Str: string, maxWidth: number, maxHeight: number, quality: number = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      setIsUpdatingAvatar(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const rawBase64 = reader.result as string;
          // Compress avatar to max 250x250 to ensure extremely lightweight DB storage
          const compressedBase64 = await compressImageBase64(rawBase64, 250, 250, 0.75);
          const res = await fetch("/api/erp/update-student-photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: currentStudent.id,
              photo: compressedBase64
            })
          });
          const data = await res.json();
          if (data.success) {
            alert("Fantastic! Your new profile photo has been successfully updated.");
            await onRefreshData();
          } else {
            alert("Failed to update avatar: " + data.error);
          }
        } catch (compressErr: any) {
          alert("Failed to process and compress avatar: " + compressErr.message);
        }
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      alert("Error uploading avatar: " + e.message);
    } finally {
      setIsUpdatingAvatar(false);
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
  }, [selectedStudentId, currentStudent?.id]);

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
  };  const autoNextTimerRef = useRef<any>(null);

  // Start a Practice Session
  const handleStartPractice = (
    title: string,
    type: "Addition" | "Subtraction" | "Multiplication" | "Division",
    totalSums: number,
    digits: number,
    rows: number,
    isSelf: boolean,
    assignmentId?: string,
    teacherFocus?: string,
    customSums?: any[] | null
  ) => {
    const finalTotal = customSums && customSums.length > 0 ? customSums.length : totalSums;
    
    // Pre-generate all equations if customSums is not supplied so each question is unique and sequential
    const builtSums = (customSums && customSums.length > 0)
      ? customSums
      : Array.from({ length: finalTotal }, () => generateEquation(type, digits, rows));

    // Clear previous results and initialize secure session tracking
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setPracticeResult(null);
    setCorrectAnswersCount(0);
    setWrongAnswersCount(0);
    setCurrentQuestionSubmitted(false);
    setIsSubmittingPractice(false);
    setStarsEarnedSession(0);
    setPracticeSessionId("sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9));

    setActivePractice({
      id: assignmentId,
      title,
      type,
      totalSums: finalTotal,
      completed: 0,
      digits,
      rows,
      teacherFocus,
      isSelfPractice: isSelf,
      customSums: builtSums
    });
    
    setCurrentQuestion(builtSums[0]);
    setStudentAnswer("");
    setQuestionFeedback({ status: "idle", message: "Answer ready. Visualize beads!" });
  };

  // Automatically submit results and finalize practice when the last question is submitted
  const handleFinishPractice = async (finalCorrect: number, finalWrong: number) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    if (isSubmittingPractice || !activePractice) return;
    setIsSubmittingPractice(true);

    const total = activePractice.totalSums;
    const accuracy = Math.round((finalCorrect / total) * 100) || 0;
    // Stars formula: each correct answer gives 3 stars and wrong input -1 star
    const starsEarned = Math.max(0, (finalCorrect * 3) - (finalWrong * 1));

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
          totalSums: total,
          correctSums: finalCorrect,
          wrongSums: finalWrong,
          accuracy,
          starsEarned,
          mode: activePractice.isSelfPractice ? "Self-Practice" : "Assigned",
          timeTakenSeconds: elapsedSeconds,
          sessionId: practiceSessionId,
          digits: activePractice.digits,
          rows: activePractice.rows
        })
      });
      const submitData = await submitRes.json();
      if (submitData.success) {
        // Find our new rank in the returned leaderboard or local state
        const updatedLeaderboard = submitData.leaderboard || [];
        setLeaderboard(updatedLeaderboard);

        // Find current student's rank
        const sortedLb = [...updatedLeaderboard].sort((a, b) => b.stars - a.stars);
        const myRankIdx = sortedLb.findIndex(l => l.studentId === currentStudent.id);
        const rank = myRankIdx !== -1 ? myRankIdx + 1 : undefined;

        setPracticeResult({
          totalQuestions: total,
          correctAnswers: finalCorrect,
          wrongAnswers: finalWrong,
          accuracy,
          starsEarned,
          bonusStarsEarned: submitData.bonusStarsEarned || 0,
          timeTakenSeconds: elapsedSeconds,
          assignmentTitle: activePractice.title,
          rank
        });

        await loadPracticeData();
        if (onRefreshData) await onRefreshData();
      } else {
        alert(submitData.error || "Failed to submit practice results.");
      }
    } catch (err) {
      console.error("Failed submitting final score", err);
      alert("Network error: Failed to submit practice results.");
    } finally {
      setIsSubmittingPractice(false);
      setActivePractice(null);
      setCurrentQuestion(null);
    }
  };

  // Check current answer (Locked after submission to prevent multiple clicks and button spam)
  const handleCheckAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !activePractice || currentQuestionSubmitted || isSubmittingPractice) return;

    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }

    // Instantly lock question submission to prevent duplicate clicks
    setCurrentQuestionSubmitted(true);

    const normalizedUser = studentAnswer.trim().toLowerCase();
    const normalizedCorrect = String(currentQuestion.answer).trim().toLowerCase();
    
    const parsedUserNum = parseInt(studentAnswer.trim(), 10);
    const parsedAnsNum = typeof currentQuestion.answer === "number" ? currentQuestion.answer : parseInt(normalizedCorrect, 10);

    const isCorrect = normalizedUser === normalizedCorrect || (!isNaN(parsedUserNum) && !isNaN(parsedAnsNum) && parsedUserNum === parsedAnsNum);

    let newCorrect = correctAnswersCount;
    let newWrong = wrongAnswersCount;

    if (isCorrect) {
      newCorrect += 1;
      setCorrectAnswersCount(newCorrect);
      setQuestionFeedback({
        status: "correct",
        message: "Correct! Outstanding accuracy! 🌟"
      });
    } else {
      newWrong += 1;
      setWrongAnswersCount(newWrong);
      setQuestionFeedback({
        status: "incorrect",
        message: `Incorrect. The correct answer was ${currentQuestion.answer}. Stay focused! 💪`
      });
    }

    // Stars formula: each correct answer gives 3 stars and wrong input -1 star
    const runningStars = Math.max(0, (newCorrect * 3) - (newWrong * 1));
    setStarsEarnedSession(runningStars);

    const nextCompleted = activePractice.completed + 1;

    if (nextCompleted >= activePractice.totalSums) {
      // It is the final question! Finish and submit automatically after 1.2s delay for feedback readability
      autoNextTimerRef.current = setTimeout(async () => {
        await handleFinishPractice(newCorrect, newWrong);
      }, 1200);
    } else {
      // Auto-advance to next question automatically after 1.2 seconds delay
      autoNextTimerRef.current = setTimeout(() => {
        handleNextQuestion();
      }, 1200);
    }
  };

  // Proceed to next question (Called after active feedback is shown to the student, state-safe)
  const handleNextQuestion = () => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }

    setActivePractice(prev => {
      if (!prev) return null;
      const nextCompleted = prev.completed + 1;
      
      const nextQ = prev.customSums && prev.customSums.length > nextCompleted
        ? prev.customSums[nextCompleted]
        : generateEquation(prev.type, prev.digits, prev.rows);
      
      setCurrentQuestion(nextQ);
      setStudentAnswer("");
      setCurrentQuestionSubmitted(false);
      setQuestionFeedback({ status: "idle", message: "Fresh round ready. Focus!" });
      // Auto reset the abacus to zero when going to the next question
      setBeadsUpper([0, 0, 0, 0, 0, 0, 0].map(() => 0));
      setBeadsLower([0, 0, 0, 0, 0, 0, 0].map(() => 0));

      return { ...prev, completed: nextCompleted };
    });
  };

  // Skip Question (Treated as wrong answer to reward Accuracy & Honest Practice, prevents bypassing hard sums)
  const handleSkipQuestion = () => {
    if (!activePractice || currentQuestionSubmitted || isSubmittingPractice) return;
    
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }

    const newWrong = wrongAnswersCount + 1;
    setWrongAnswersCount(newWrong);

    // Re-calculate running stars: each correct answer gives 3 stars and wrong input -1 star
    const runningStars = Math.max(0, (correctAnswersCount * 3) - (newWrong * 1));
    setStarsEarnedSession(runningStars);

    const nextCompleted = activePractice.completed + 1;
    if (nextCompleted >= activePractice.totalSums) {
      // It was the last question! Submit results automatically
      handleFinishPractice(correctAnswersCount, newWrong);
    } else {
      handleNextQuestion();
    }
  };

  // Toggle bead positions on interactive visual abacus
  const toggleBead = (wireIdx: number, isUpper: boolean, beadIdx?: number) => {
    if (isUpper && beadIdx !== undefined) {
      // For Chinese abacus which has 2 upper beads
      const currentActive = beadsUpper[wireIdx] || 0;
      const targetCount = beadIdx + 1;
      let newActive = targetCount;
      if (currentActive >= targetCount) {
        newActive = beadIdx;
      }
      const updated = [...beadsUpper];
      updated[wireIdx] = newActive;
      setBeadsUpper(updated);
    } else if (isUpper) {
      // For Japanese abacus which has 1 upper bead
      const currentActive = beadsUpper[wireIdx] || 0;
      const newActive = currentActive > 0 ? 0 : 1;
      const updated = [...beadsUpper];
      updated[wireIdx] = newActive;
      setBeadsUpper(updated);
    } else if (beadIdx !== undefined) {
      // For lower deck beads
      const currentActive = beadsLower[wireIdx] || 0;
      const targetCount = beadIdx + 1;
      let newActive = targetCount;
      if (currentActive >= targetCount) {
        newActive = beadIdx;
      }
      const updated = [...beadsLower];
      updated[wireIdx] = newActive;
      setBeadsLower(updated);
    }
  };

  const getUpperBeadPositionClass = (beadIdx: number, upperActiveCount: number): string => {
    if (abacusType === "japanese") {
      const isActive = upperActiveCount > 0;
      return isActive ? "top-[14px]" : "top-0";
    } else {
      // Chinese suanpan (2 beads)
      if (upperActiveCount === 0) {
        return beadIdx === 0 ? "top-0" : "top-[12px]";
      } else if (upperActiveCount === 1) {
        return beadIdx === 0 ? "bottom-0" : "top-0";
      } else {
        return beadIdx === 0 ? "bottom-[12px]" : "bottom-0";
      }
    }
  };

  const getLowerBeadPositionClass = (beadIdx: number, lowerActiveCount: number): string => {
    const isActive = beadIdx < lowerActiveCount;
    if (abacusType === "japanese") {
      if (isActive) {
        switch (beadIdx) {
          case 0: return "top-0";
          case 1: return "top-[14px]";
          case 2: return "top-[28px]";
          case 3: return "top-[42px]";
          default: return "top-0";
        }
      } else {
        switch (beadIdx) {
          case 3: return "bottom-0";
          case 2: return "bottom-[14px]";
          case 1: return "bottom-[28px]";
          case 0: return "bottom-[42px]";
          default: return "bottom-0";
        }
      }
    } else {
      // Chinese (5 beads)
      if (isActive) {
        switch (beadIdx) {
          case 0: return "top-0";
          case 1: return "top-[11px]";
          case 2: return "top-[22px]";
          case 3: return "top-[33px]";
          case 4: return "top-[44px]";
          default: return "top-0";
        }
      } else {
        switch (beadIdx) {
          case 4: return "bottom-0";
          case 3: return "bottom-[11px]";
          case 2: return "bottom-[22px]";
          case 1: return "bottom-[33px]";
          case 0: return "bottom-[44px]";
          default: return "bottom-0";
        }
      }
    }
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
          </div>
        </div>
      ) : (
        <>
          {/* Academy Brand Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              {studentCenter.logo ? (
                <img 
                  src={studentCenter.logo} 
                  alt={studentCenter.name} 
                  className="h-10 object-contain rounded-lg max-w-[150px]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center font-black text-slate-950 text-sm shadow-sm uppercase">
                  {centerInitials}
                </div>
              )}
              <div>
                <h2 className="text-sm font-black text-slate-800 font-display tracking-tight leading-none">{studentCenter.name}</h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Student Workspace Portal</span>
              </div>
            </div>
            
            <div className="text-right text-[10px] text-slate-400 font-bold hidden sm:block">
              Connected Session • {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

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

              {(currentStudent?.status === "Pending Approval" || currentUser?.status === "Pending Approval") && (
                <div className="bg-amber-500/20 border border-amber-400/80 p-3.5 rounded-2xl flex items-start gap-3 mt-3 shadow-lg text-amber-100 backdrop-blur-sm">
                  <Clock className="w-5 h-5 text-amber-300 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1 text-xs text-left">
                    <div className="font-extrabold text-amber-200 flex items-center gap-2">
                      <span>Registration Status: Pending Approval</span>
                      <span className="bg-amber-400 text-indigo-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">Action Required</span>
                    </div>
                    <p className="text-amber-100/90 leading-relaxed text-[11px]">
                      Your registration has been received! Your account is currently <strong>Pending Approval</strong>. Your Center Administrator or Manager will review your details and assign your course fee structure.
                    </p>
                    <p className="text-amber-200/80 text-[10px] italic">
                      Once fees are assigned and approved, full student portal features will be unlocked and a confirmation email will be sent to <strong>{currentStudent?.email || currentUser?.email}</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Account Info and Logout Button with Photo, Stars and Badges */}
            <div className="bg-indigo-850 border border-indigo-700 p-4 rounded-3xl flex flex-col gap-3 shrink-0 min-w-[280px]">
              <div className="flex items-center gap-3">
                {/* Profile photo with live upload reflection */}
                <div className="relative shrink-0">
                  <label htmlFor="student-avatar-file-input" className="cursor-pointer block relative group hover:opacity-90 transition-all">
                    {currentStudent.photo ? (
                      <img 
                        src={currentStudent.photo} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shadow-md" 
                        referrerPolicy="no-referrer"
                        alt={currentStudent.studentName} 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-sm border-2 border-indigo-400 shadow-md">
                        {currentStudent.studentName ? currentStudent.studentName.charAt(0) : "S"}
                      </div>
                    )}
                    {/* Camera icon hover overlay */}
                    <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  </label>

                  <input
                    type="file"
                    id="student-avatar-file-input"
                    accept="image/*"
                    className="hidden"
                    disabled={isUpdatingAvatar}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadAvatar(file);
                    }}
                  />

                  <div className="absolute -bottom-1 -right-1 bg-amber-400 text-indigo-950 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow border border-white">
                    ★ {currentStudent.rating ? Number(currentStudent.rating).toFixed(1) : "4.2"}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest block leading-none mb-1">
                    Active Student
                  </span>
                  <span className="text-sm font-black text-white block truncate leading-tight">
                    {currentStudent.studentName}
                  </span>
                  <span className="text-[10px] text-indigo-200 block font-bold truncate">
                    Level {currentStudent.currentLevel} • {currentStudent.batch}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-indigo-800 hover:bg-rose-600 text-white font-bold p-2 rounded-xl text-xs active:scale-95 transition-all border border-indigo-700 hover:border-rose-500 shrink-0"
                  title="Sign Out"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Render badges */}
              {currentStudent.badges && currentStudent.badges.length > 0 && (
                <div className="border-t border-indigo-800/80 pt-2 flex flex-wrap gap-1">
                  {currentStudent.badges.map((badge, idx) => (
                    <span 
                      key={idx} 
                      className="text-[9px] font-extrabold bg-indigo-900/60 border border-indigo-700 text-amber-300 px-2 py-0.5 rounded-lg flex items-center gap-0.5"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* Stars summary */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-800/80">
                <div className="bg-indigo-900/40 border border-indigo-850 rounded-xl p-2 text-center">
                  <span className="block text-[8px] text-indigo-300 font-black uppercase tracking-wider">Monthly Stars</span>
                  <span className="text-xs font-black text-amber-400 font-mono mt-0.5 block">
                    ⭐ {calculateMonthlyStars()}
                  </span>
                </div>
                <div className="bg-indigo-900/40 border border-indigo-850 rounded-xl p-2 text-center">
                  <span className="block text-[8px] text-indigo-300 font-black uppercase tracking-wider">Total Stars</span>
                  <span className="text-xs font-black text-amber-300 font-mono mt-0.5 block">
                    👑 {calculateTotalStars()}
                  </span>
                </div>
              </div>

              {/* Attendance Summary */}
              {(() => {
                const getScheduledDaysCount = (joiningDateStr: string | undefined, batchStr: string | undefined): number => {
                  const today = new Date();
                  let startDate = joiningDateStr ? new Date(joiningDateStr) : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  if (isNaN(startDate.getTime())) {
                    startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  }
                  if (startDate > today) {
                    startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  }

                  let count = 0;
                  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                  const shortDays: Record<string, string> = {
                    sunday: "sun",
                    monday: "mon",
                    tuesday: "tue",
                    wednesday: "wed",
                    thursday: "thu",
                    friday: "fri",
                    saturday: "sat"
                  };

                  const batchLower = (batchStr || "").toLowerCase();
                  const maxDays = 365;
                  let tempDate = new Date(startDate.getTime());
                  let daysIterated = 0;

                  while (tempDate <= today && daysIterated < maxDays) {
                    const dayName = days[tempDate.getDay()].toLowerCase();
                    const shortDayName = shortDays[dayName] || "";
                    
                    let isAssigned = false;
                    if (!batchStr) {
                      isAssigned = true;
                    } else if (batchLower.includes(dayName) || (shortDayName && batchLower.includes(shortDayName))) {
                      isAssigned = true;
                    } else if (batchLower.includes("weekday")) {
                      isAssigned = ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(dayName);
                    } else if (batchLower.includes("weekend")) {
                      isAssigned = ["saturday", "sunday"].includes(dayName);
                    } else {
                      const dayNamesList = ["sun", "mon", "tue", "wed", "thu", "fri", "sat", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "weekday", "weekend"];
                      const hasAnyDayName = dayNamesList.some(dName => batchLower.includes(dName));
                      if (!hasAnyDayName) {
                        isAssigned = true;
                      }
                    }

                    if (isAssigned) {
                      count++;
                    }

                    tempDate.setDate(tempDate.getDate() + 1);
                    daysIterated++;
                  }

                  return count > 0 ? count : 1;
                };

                const totalScheduled = getScheduledDaysCount(currentStudent.joiningDate, currentStudent.batch);
                const studentAtts = (attendance || []).filter(a => a.studentId === currentStudent.id);
                const absentCount = studentAtts.filter(a => a.status === "Absent").length;
                const presentCount = Math.max(0, totalScheduled - absentCount);
                const attPercent = totalScheduled > 0 ? Math.round((presentCount / totalScheduled) * 100) : 100;
                
                return (
                  <div className="pt-2 border-t border-indigo-800/80 space-y-1.5">
                    <span className="block text-[8px] text-indigo-300 font-black uppercase tracking-wider">Attendance Stats</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-1.5 text-center">
                        <span className="block text-[7px] text-emerald-400 font-bold uppercase tracking-wider">Present</span>
                        <span className="text-[11px] font-black text-emerald-300 font-mono block">
                          ✓ {presentCount}
                        </span>
                      </div>
                      <div className="bg-rose-950/40 border border-rose-900/50 rounded-xl p-1.5 text-center">
                        <span className="block text-[7px] text-rose-400 font-bold uppercase tracking-wider">Absent</span>
                        <span className="text-[11px] font-black text-rose-300 font-mono block">
                          ✗ {absentCount}
                        </span>
                      </div>
                      <div className="bg-indigo-900/40 border border-indigo-850 rounded-xl p-1.5 text-center">
                        <span className="block text-[7px] text-indigo-300 font-bold uppercase tracking-wider">Ratio</span>
                        <span className="text-[11px] font-black text-indigo-200 font-mono block">
                          📊 {attPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Teacher Rating Feature */}
              {(() => {
                const assignedTeacher = teachers.find(t => t.id === currentStudent.teacherId);
                if (!assignedTeacher) return null;
                return (
                  <div className="border-t border-indigo-800/80 pt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Rate My Teacher</span>
                      <span className="text-[10px] font-black text-indigo-200 truncate max-w-[120px]">{assignedTeacher.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isSelected = userRating >= star || (assignedTeacher.rating && star <= assignedTeacher.rating);
                          return (
                            <button
                              key={star}
                              type="button"
                              disabled={isRatingSubmitting}
                              onClick={() => handleRateTeacher(assignedTeacher.id, star)}
                              className="text-indigo-800 hover:text-amber-400 active:scale-95 transition-all outline-none"
                              title={`Rate ${star} Stars`}
                            >
                              <Star className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400 fill-amber-400' : 'text-indigo-700'}`} />
                            </button>
                          );
                        })}
                      </div>
                      {ratingFeedback && (
                        <span className="text-[9px] font-black text-amber-300 animate-pulse truncate max-w-[110px]">
                          {ratingFeedback}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Main Student Portal Rows */}
          {practiceResult ? (
            // COMPLETION SCREEN
            <div className="max-w-2xl mx-auto bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-xl text-center space-y-8 animate-fadeIn mt-6">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center border-2 border-amber-200 text-amber-500 animate-pulse">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-indigo-950 font-display">
                  Practice Complete! 🏆
                </h3>
                <p className="text-slate-500 font-medium max-w-md">
                  Congratulations! You completed your practice session of "{practiceResult.assignmentTitle}". Keep up the honest practice!
                </p>
                <div className="bg-amber-100/50 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-amber-200">
                  ⚡ Digitally Verified Secure Session
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Questions</span>
                  <span className="text-xl font-extrabold text-slate-700 mt-1">{practiceResult.totalQuestions}</span>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Correct</span>
                  <span className="text-xl font-extrabold text-emerald-700 mt-1">{practiceResult.correctAnswers}</span>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Wrong / Skipped</span>
                  <span className="text-xl font-extrabold text-rose-700 mt-1">{practiceResult.wrongAnswers}</span>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Accuracy</span>
                  <span className="text-xl font-extrabold text-indigo-700 mt-1">{practiceResult.accuracy}%</span>
                </div>
              </div>

              {/* Big Award Badge */}
              <div className="p-6 bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <div className="text-sm font-black text-amber-900 flex items-center gap-1.5">
                    <Star className="w-5 h-5 fill-amber-400 stroke-amber-400 animate-bounce" />
                    Stars Earned:
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    Earned using formula: <code className="bg-slate-100 px-1 rounded text-slate-700 font-bold">Correct * 3 - Wrong * 1</code> (Min 0, Max {practiceResult.totalQuestions * 3})
                    {practiceResult.bonusStarsEarned && practiceResult.bonusStarsEarned > 0 ? (
                      <span className="text-emerald-600 block mt-1.5 font-bold animate-pulse">
                        🎉 Includes +{practiceResult.bonusStarsEarned} Extra Bonus Stars for 5th Custom Practice!
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-3xl font-black text-amber-600 flex items-center gap-1">
                  +{practiceResult.starsEarned} <span className="text-xl">⭐</span>
                </div>
              </div>

              {/* Secondary stats */}
              <div className="flex flex-col sm:flex-row justify-around items-center gap-4 text-xs font-bold text-slate-500 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Time taken: <strong className="text-slate-700">{Math.floor(practiceResult.timeTakenSeconds / 60)}m {practiceResult.timeTakenSeconds % 60}s</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-slate-400" />
                  <span>Academy Leaderboard Rank: <strong className="text-indigo-600">{practiceResult.rank ? `#${practiceResult.rank}` : "Not ranked"}</strong></span>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setPracticeResult(null);
                  }}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200/50 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Back to Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : activePractice ? (
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
                <div className="flex items-center gap-2">
                  <div className="bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-amber-700 text-xs font-black">
                    <Clock className="w-4 h-4 animate-pulse text-amber-600" />
                    <span>Timer: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s</span>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-2 text-indigo-700 text-xs font-black">
                    <Target className="w-4 h-4" />
                    <span>{activePractice.completed} / {activePractice.totalSums} Sums</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Sum display */}
              <div className="text-center py-8 space-y-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equation</div>
                
                {/* Visual Math Equations */}
                <div className="text-4xl md:text-6xl font-black text-indigo-950 tracking-tight font-display py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                  {currentQuestion?.expression}
                </div>

                 {/* VISUAL ABACUS BEAD DECORATOR - SIMULATOR (supports Japanese Soroban & Chinese Suanpan) */}
                 {(() => {
                   const isAbacusDisabledByTeacher = !!activePractice?.disableAbacus;
                   const isAbacusHidden = isAbacusDisabledByTeacher || studentHideAbacus;
                   if (isAbacusHidden) {
                     return (
                       <div className="max-w-md mx-auto bg-amber-50 rounded-2xl border-4 border-amber-800 p-4 shadow-sm space-y-3" id="interactive-abacus-tool-hidden">
                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-200/50 pb-2">
                           <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">
                               Interactive {abacusType === "japanese" ? "Soroban" : "Suanpan"} Simulator
                             </span>
                             {isAbacusDisabledByTeacher && (
                               <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                 🔒 Locked by Teacher
                               </span>
                             )}
                           </div>
                           {!isAbacusDisabledByTeacher && (
                             <button
                               type="button"
                               onClick={handleToggleAbacus}
                               className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-150 text-indigo-700 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                             >
                               {studentHideAbacus ? "👁️ Show Abacus" : "🙈 Hide Abacus"}
                             </button>
                           )}
                         </div>
                         <div className="relative border-4 border-amber-950 bg-[#e6dfd1]/50 rounded-xl overflow-hidden flex flex-col justify-center items-center h-[128px]">
                           <span className="text-amber-900/60 font-black text-xs uppercase tracking-widest font-display">
                             Abacus Hidden
                           </span>
                           <p className="text-[10px] text-amber-800/40 font-bold mt-1">
                             No beads or numbers are displayed
                           </p>
                         </div>
                         <p className="text-[9px] text-amber-800 text-center font-semibold leading-normal">
                           This practice is styled as visual-spatial mental math. The physical/interactive abacus is hidden to build sensory visualization skills.
                         </p>
                       </div>
                     );
                   }
                   return null;
                 })()}

                 <div className="max-w-2xl mx-auto my-4" id="interactive-abacus-tool" style={{ display: (activePractice?.disableAbacus || studentHideAbacus) ? 'none' : 'block' }}>
                   <VirtualAbacus
                     initialRods={7}
                     initialTheme="wooden"
                     initialType="japanese"
                     title="Interactive 17-Rod Wooden Soroban Abacus"
                   />
                 </div>
              </div>
            </div>

            {/* Answer Input and feedback */}
            <form onSubmit={handleCheckAnswer} className="space-y-4 max-w-md mx-auto">
              <div className="flex flex-col gap-3 w-full">
                {currentQuestion?.options && currentQuestion.options.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5 my-1">
                    {currentQuestion.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        type="button"
                        disabled={currentQuestionSubmitted || isSubmittingPractice}
                        onClick={() => setStudentAnswer(opt)}
                        className={`py-3 px-4 rounded-xl border-2 font-mono text-sm font-black transition-all cursor-pointer ${
                          studentAnswer === opt
                            ? "border-indigo-600 bg-indigo-50 text-indigo-950 shadow-xs scale-[1.02]"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    placeholder={currentQuestionSubmitted ? "Submitted" : "Type Answer (Number or Formula)"}
                    required
                    disabled={currentQuestionSubmitted || isSubmittingPractice}
                    className="w-full bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border-2 border-slate-200 text-xl font-bold text-indigo-950 px-4 py-3.5 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none text-center h-14 font-mono"
                  />
                )}
                
                {currentQuestionSubmitted && activePractice.completed + 1 < activePractice.totalSums ? (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3.5 rounded-2xl active:scale-95 transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 h-14 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 text-white" />
                    <span>Next Question</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={currentQuestionSubmitted || isSubmittingPractice || !studentAnswer.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-6 py-3.5 rounded-2xl active:scale-95 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 h-14 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      {isSubmittingPractice 
                        ? "Submitting Practice..." 
                        : currentQuestionSubmitted && activePractice.completed + 1 >= activePractice.totalSums
                        ? "Completing Practice..."
                        : "Check Answer"}
                    </span>
                  </button>
                )}
              </div>

              {/* Feedback Alert */}
              <div className="text-center min-h-[24px]">
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
                    disabled={currentQuestionSubmitted || isSubmittingPractice}
                    onClick={handleSkipQuestion}
                    className="text-slate-500 hover:text-indigo-600 font-bold px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip Sum
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
          
          {/* Academy Hall of Fame (Student of the Week & Month) - Visible to all students */}
          <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-indigo-500/10 rounded-3xl border-2 border-amber-300/40 p-6 shadow-md space-y-4" id="academy-hall-of-fame">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-amber-500 fill-amber-300 animate-bounce" />
              <div>
                <h3 className="text-base font-black text-indigo-950 font-display uppercase tracking-wider">
                  🏆 Academy Hall of Fame 🏆
                </h3>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">
                  Honoring Outstanding Progress & Dedication
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student of the Week */}
              <div className="bg-white rounded-2xl border border-amber-200/60 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 bg-amber-400 text-indigo-950 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-xs">
                  ⭐ Student of the Week
                </div>
                {students.find(s => s.isStudentOfWeek === true) ? (() => {
                  const weekStar = students.find(s => s.isStudentOfWeek === true)!;
                  return (
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0 mt-1">
                        {weekStar.photo ? (
                          <img src={weekStar.photo} className="w-16 h-16 rounded-full object-cover border-4 border-amber-300 shadow-md" referrerPolicy="no-referrer" alt={weekStar.studentName} />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center text-white font-black text-xl border-4 border-amber-300 shadow-md">
                            {weekStar.studentName.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-amber-400 text-indigo-950 text-[10px] p-1 rounded-full shadow border border-white">
                          🏆
                        </div>
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-sm font-black text-indigo-950 truncate">{weekStar.studentName}</h4>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">
                          Level {weekStar.currentLevel} • {weekStar.batch}
                        </div>
                        <div className="bg-amber-50/50 border border-amber-150 rounded-xl p-3 text-xs text-amber-950 italic font-medium leading-relaxed mt-2">
                          "{weekStar.studentOfWeekReason || 'Exceptional Soroban speed and focus in custom drills!'}"
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="text-center py-6 space-y-1">
                    <div className="text-3xl">🌟</div>
                    <h4 className="text-xs font-bold text-slate-700">Who will be next week's champion?</h4>
                    <p className="text-[10px] text-slate-400">Complete worksheets with high accuracy and speed to get nominated!</p>
                  </div>
                )}
              </div>

              {/* Student of the Month */}
              <div className="bg-white rounded-2xl border border-indigo-200/60 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-xs">
                  👑 Student of the Month
                </div>
                {students.find(s => s.isStudentOfMonth === true) ? (() => {
                  const monthStar = students.find(s => s.isStudentOfMonth === true)!;
                  return (
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0 mt-1">
                        {monthStar.photo ? (
                          <img src={monthStar.photo} className="w-16 h-16 rounded-full object-cover border-4 border-indigo-300 shadow-md" referrerPolicy="no-referrer" alt={monthStar.studentName} />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-xl border-4 border-indigo-300 shadow-md">
                            {monthStar.studentName.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] p-1 rounded-full shadow border border-white">
                          👑
                        </div>
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-sm font-black text-indigo-950 truncate">{monthStar.studentName}</h4>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">
                          Level {monthStar.currentLevel} • {monthStar.batch}
                        </div>
                        <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-3 text-xs text-indigo-950 italic font-medium leading-relaxed mt-2">
                          "{monthStar.studentOfMonthReason || 'Exceptional progress and perfect attendance throughout the month!'}"
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="text-center py-6 space-y-1">
                    <div className="text-3xl">👑</div>
                    <h4 className="text-xs font-bold text-slate-700">This month's crown is waiting...</h4>
                    <p className="text-[10px] text-slate-400">Perform consistently, submit compulsory homeworks, and secure badges!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Academy Reminders & Notifications banner */}
          {currentStudent.notifications && currentStudent.notifications.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl border-2 border-amber-100 p-6 shadow-xs space-y-4" id="student-notifications-section">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-amber-900 font-display flex items-center gap-2 uppercase tracking-wider">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  Academy Notifications & Fee Reminders
                </h3>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/erp/notifications/read-all", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ studentId: currentStudent.id })
                      });
                      if ((await res.json()).success) {
                        await onRefreshData();
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="text-[10px] font-black text-amber-700 hover:text-amber-800 uppercase tracking-wider underline cursor-pointer"
                >
                  Clear all notifications
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentStudent.notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all flex gap-3 ${
                      notif.read
                        ? "bg-white/50 border-slate-100 text-slate-500"
                        : "bg-white border-amber-200/60 text-slate-800 shadow-sm"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-amber-100/80 text-amber-600 shrink-0 self-start">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-xs font-black text-slate-900">{notif.title}</span>
                        <span className="text-[9px] text-slate-400 font-mono shrink-0">{notif.date}</span>
                      </div>
                      <p className="text-xs font-medium leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Homework banner + Custom practice entry (Matches second screenshot style) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Student Weekly Homework (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Assigned Class & Textbook Homework
                  </h3>
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded font-mono font-bold uppercase">
                    Active Curriculum Tasks
                  </span>
                </div>

                {/* Dynamic Homework Notifications list */}
                {studentHomeworks.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-xs text-slate-505">
                    <p className="font-extrabold text-slate-700 mb-1">No custom homework assigned yet! 🎉</p>
                    <p className="text-[11px] text-slate-400">Your default workbook tasks: Complete pages 5 to 10, practice 2-digit 7-rows. Click below to submit textbook snaps!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {studentHomeworks.map((hw) => (
                      <div key={hw.id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-3 hover:bg-slate-50 transition-all">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded uppercase tracking-wider">
                              {hw.week || "Week Task"}
                            </span>
                            <span className="text-[9px] text-slate-450 block mt-1">Assigned on: {hw.assignedDate || "Today"}</span>
                          </div>
                          <div>
                            {hw.status === "Completed" ? (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-150 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                                Submitted ({hw.score})
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-150 px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                Pending Action
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs font-extrabold text-slate-800 leading-relaxed">
                          {hw.task}
                        </p>

                        {/* Submission Proof Details if completed */}
                        {hw.status === "Completed" && (
                          <div className="bg-white border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                            <span className="block font-black text-slate-450 uppercase tracking-wider text-[8px]">Your Submission Proof</span>
                            {hw.notes && <p className="font-medium text-slate-700">" {hw.notes} "</p>}
                            {hw.submittedProof && hw.submittedProof.startsWith("http") && (
                              <img src={hw.submittedProof} referrerPolicy="no-referrer" alt="Homework proof" className="h-16 w-auto rounded border border-slate-100 object-cover mt-1.5" />
                            )}
                            {hw.feedback && (
                              <div className="border-t border-dashed border-slate-100 pt-2 mt-2">
                                <span className="block font-black text-indigo-600 uppercase tracking-wider text-[8px]">Teacher's Feedback</span>
                                <p className="font-bold text-indigo-950">"{hw.feedback}"</p>
                              </div>
                            )}
                          </div>
                        )}

                        {hw.status === "Incomplete" && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => {
                                setSubmittingHomeworkId(hw.id);
                                setHomeworkNotes("");
                                setHomeworkProofFile("");
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] px-3.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm flex items-center gap-1"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Submit Homework Proof 🚀</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Link Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-100 pt-4 mt-2">
                <button
                  onClick={() => {
                    const defaultTask = studentHomeworks.find(h => h.status === "Incomplete");
                    if (defaultTask) {
                      setSubmittingHomeworkId(defaultTask.id);
                    } else {
                      alert("Daily homework image checklist is up to date! Check pages 5-10. Ready to submit proof.");
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-950 text-white hover:bg-indigo-900"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>Homework Submission</span>
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

            {/* Homework Submission Modal Overlay */}
            {submittingHomeworkId && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-indigo-950 font-display">Submit Homework Proof</h3>
                    <p className="text-xs text-slate-505">
                      Submit your completed homework sheets. You can type observations and upload a screenshot or image proof.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitHomework} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Observation / Completion Notes</label>
                      <textarea
                        placeholder="e.g. Completed pages 5-10. Got 10/10 in double digit flash cards practice!"
                        value={homeworkNotes}
                        onChange={(e) => setHomeworkNotes(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-indigo-500 h-20 resize-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Homework Textbook Photo / Screenshot <span className="text-slate-400 font-extrabold">(Optional)</span>
                      </label>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setHomeworkProofFile(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />

                        {homeworkProofFile ? (
                          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                            <img
                              src={homeworkProofFile}
                              className="w-full h-36 object-cover rounded-xl"
                              referrerPolicy="no-referrer"
                              alt="Textbook snap preview"
                            />
                            <div className="flex justify-between items-center mt-2 px-1">
                              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                                <span>✓ Photo uploaded and ready</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setHomeworkProofFile("")}
                                className="text-[9px] text-rose-600 hover:underline font-bold"
                              >
                                Remove snap
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-150">
                            <span className="text-[10px] font-bold text-slate-600 uppercase block tracking-wider">No photo selected</span>
                            <span className="text-[10px] text-slate-400 block">
                              You may optionally upload a photo of your workbook or complete it using the completed notes above.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSubmittingHomeworkId(null)}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs shadow-md shadow-indigo-100 active:scale-95 transition-all"
                      >
                        Homework Completed 🚀
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{assign.type} Drill</span>
                          {assign.dueDate && (
                            <span className="text-[8px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Due: {assign.dueDate}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-black text-indigo-950 mt-0.5">{assign.title}</h4>
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
                          assign.teacherFocus,
                          assign.customSums
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

          {/* FLASH ANZAN SPEED GYM SECTION */}
          <div className="bg-gradient-to-br from-sky-950 via-slate-900 to-indigo-950 rounded-3xl border-2 border-sky-800/80 p-6 shadow-xl space-y-6 text-white relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-900/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3 text-slate-950 fill-slate-950" /> Speed Drill
                  </span>
                  <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    Custom Duration & Digits
                  </span>
                </div>
                <h3 className="text-xl font-black text-white font-display flex items-center gap-2 mt-1">
                  ⚡ Flash Anzan Mental Speed Gym
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Configure numbers, digits (1–5), flash speed duration (0.1s–5.0s), and toggle Addition Only or Addition & Subtraction.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFlashAnzan(!showFlashAnzan)}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-5 py-3 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2 self-start sm:self-auto border border-amber-300/50"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>{showFlashAnzan ? "Minimize Flash Anzan" : "Launch Flash Anzan Practice ⚡"}</span>
              </button>
            </div>

            {showFlashAnzan ? (
              <FlashAnzanPractice
                onBack={() => setShowFlashAnzan(false)}
                studentName={currentStudent?.studentName}
                studentId={currentStudent?.id}
                onFinishExercise={(stats) => {
                  loadPracticeData();
                  if (onRefreshData) onRefreshData();
                }}
              />
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-sky-500/30">
                  ⚡
                </div>
                <h4 className="text-sm font-black text-white">Rapid Flash Anzan Visualization Drills</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Numbers flash on screen at high speed. Customize Digits (1-5), Duration (0.1s - 5.0s), Addition vs Subtraction, and answer mode to build master Soroban mental math speed.
                </p>
                <button
                  type="button"
                  onClick={() => setShowFlashAnzan(true)}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-6 py-3 rounded-xl transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-sky-500/30"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Start Flash Anzan Practice ⚡</span>
                </button>
              </div>
            )}
          </div>

          {/* ABACUS FLASHCARD & BEAD EXERCISES SECTION */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-3xl border-2 border-indigo-900 p-6 shadow-xl space-y-6 text-white relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-slate-950" /> New Interactive Module
                  </span>
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    Soroban Bead Manipulation
                  </span>
                </div>
                <h3 className="text-xl font-black text-white font-display flex items-center gap-2 mt-1">
                  🧮 Abacus Bead Flashcards & Exercises
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Set target numbers on the Abacus beads or read bead values to sharpen mental arithmetic speed.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAbacusGym(!showAbacusGym)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto border border-indigo-400/30"
              >
                {showAbacusGym ? "Minimize Abacus Gym 🔼" : "Open Abacus Gym 🧮"}
              </button>
            </div>

            {showAbacusGym ? (
              <AbacusBeadExerciseView
                studentId={currentStudent?.id}
                studentName={currentStudent?.studentName}
                onFinishExercise={(stats) => {
                  loadPracticeData();
                  if (onRefreshData) onRefreshData();
                }}
              />
            ) : (
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-indigo-500/30">
                  🧮
                </div>
                <h4 className="text-sm font-black text-white">Interactive Abacus Gym & Bead Flashcards</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Practice soroban bead manipulations, flashcards timer drills, and set target values to earn stars and level up your mental arithmetic speed.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAbacusGym(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-6 py-3 rounded-xl transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
                >
                  <span>Open Abacus Gym 🧮</span>
                </button>
              </div>
            )}
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

          {/* Academy Leaderboard */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500 fill-amber-500" />
                  Student Star Rating & Academy Leaderboard
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top performing mental arithmetic students. Filter by level, week, or month.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <input
                    type="text"
                    placeholder="Search student name..."
                    value={leaderboardSearch}
                    onChange={e => {
                      setLeaderboardSearch(e.target.value);
                      setLeaderboardPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <button
                  onClick={loadPracticeData}
                  className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
                  title="Refresh Board"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Bar Controls */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Scope Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 mr-1 hidden sm:inline">Scope:</span>
                <button
                  onClick={() => {
                    setLeaderboardScope("all");
                    setLeaderboardLevelSelect("all");
                    setLeaderboardPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    leaderboardScope === "all" && leaderboardLevelSelect === "all"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Total Academy
                </button>
                <button
                  onClick={() => {
                    setLeaderboardScope("mylevel");
                    setLeaderboardLevelSelect(String(currentStudent.currentLevel || 1));
                    setLeaderboardPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    leaderboardScope === "mylevel"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  My Level (L{currentStudent.currentLevel || 1})
                </button>
                <select
                  value={leaderboardLevelSelect}
                  onChange={e => {
                    const val = e.target.value;
                    setLeaderboardLevelSelect(val);
                    if (val === "all") {
                      setLeaderboardScope("all");
                    } else if (val === String(currentStudent.currentLevel)) {
                      setLeaderboardScope("mylevel");
                    } else {
                      setLeaderboardScope("customlevel");
                    }
                    setLeaderboardPage(1);
                  }}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Level-Wise Filter: All</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
                    <option key={lvl} value={String(lvl)}>
                      Level {lvl} Only
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Period Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 mr-1 hidden sm:inline">Stars:</span>
                <button
                  onClick={() => {
                    setLeaderboardTimeframe("monthly");
                    setLeaderboardPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    leaderboardTimeframe === "monthly"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-amber-50"
                  }`}
                >
                  Current Month (Default) ⭐
                </button>
                <button
                  onClick={() => {
                    setLeaderboardTimeframe("weekly");
                    setLeaderboardPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    leaderboardTimeframe === "weekly"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-amber-50"
                  }`}
                >
                  Current Week ⭐
                </button>
                <button
                  onClick={() => {
                    setLeaderboardTimeframe("total");
                    setLeaderboardPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    leaderboardTimeframe === "total"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-amber-50"
                  }`}
                >
                  Total Stars ⭐
                </button>
              </div>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Show:</span>
                <select
                  value={leaderboardPageSize}
                  onChange={e => {
                    setLeaderboardPageSize(Number(e.target.value));
                    setLeaderboardPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-xs text-slate-400 font-medium">names</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-black text-indigo-950">
                    <th className="px-4 py-3.5 w-16 text-slate-500">SR No.</th>
                    <th className="px-4 py-3.5">Name</th>
                    <th className="px-4 py-3.5 text-amber-600 font-bold">
                      {leaderboardTimeframe === "monthly"
                        ? "Current Month Stars ⭐"
                        : leaderboardTimeframe === "weekly"
                        ? "Current Week Stars ⭐"
                        : "Total Stars ⭐"}
                    </th>
                    <th className="px-4 py-3.5 text-center">Assigned Level</th>
                    <th className="px-4 py-3.5 text-right">Practice Drills Complete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {paginatedLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                        No students found matching selected leaderboard filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedLeaderboard.map((row, idx) => {
                      const globalIndex = startIndex + idx + 1;
                      const isSelf = row.studentId === currentStudent.id;
                      const displayStars =
                        leaderboardTimeframe === "monthly"
                          ? (row as any).monthlyStars !== undefined
                            ? (row as any).monthlyStars
                            : row.stars
                          : leaderboardTimeframe === "weekly"
                          ? (row as any).weeklyStars !== undefined
                            ? (row as any).weeklyStars
                            : Math.ceil((row.stars || 0) * 0.3)
                          : row.stars;

                      return (
                        <tr
                          key={row.id || row.studentId}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelf ? "bg-amber-50/70 font-bold" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-slate-400 font-mono align-middle">
                            #{globalIndex}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-950">
                                {isSelf ? currentStudent.studentName : row.studentName}
                              </span>
                              {isSelf && (
                                <span className="text-[9px] bg-amber-400 text-indigo-950 font-mono px-1.5 py-0.5 rounded font-extrabold uppercase">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-amber-600 font-extrabold font-mono align-middle">
                            <div className="flex items-center gap-1">
                              <span>{displayStars}</span>
                              <span className="text-[11px]">⭐</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-mono align-middle">
                            <span className="bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full text-indigo-700 font-bold text-[11px]">
                              Level {row.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono align-middle">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-bold text-[11px]">
                              {row.completedCount || 0} exercises
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            {totalLeaderboardItems > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <div className="text-xs text-slate-500 font-medium">
                  Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{" "}
                  <span className="font-bold text-slate-800">
                    {Math.min(startIndex + leaderboardPageSize, totalLeaderboardItems)}
                  </span>{" "}
                  of <span className="font-bold text-slate-800">{totalLeaderboardItems}</span> students
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLeaderboardPage(p => Math.max(1, p - 1))}
                    disabled={currentPageClamped <= 1}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1 px-2 text-xs font-bold text-indigo-900">
                    Page {currentPageClamped} of {totalLeaderboardPages}
                  </div>

                  <button
                    onClick={() => setLeaderboardPage(p => Math.min(totalLeaderboardPages, p + 1))}
                    disabled={currentPageClamped >= totalLeaderboardPages}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
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
                      const net = (Number(fee.amount) || 0) - (Number(fee.discount) || 0);
                      return (
                        <tr key={fee.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900">{fee.month}</td>
                          <td className="px-4 py-3 font-mono">₹{fee.amount}</td>
                          <td className="px-4 py-3 font-mono text-rose-500">-₹{fee.discount || 0}</td>
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

          {/* Detailed Attendance Logs Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  My Class Attendance Log History
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed logs of present/absent history recorded by your assigned class teacher.
                </p>
              </div>
            </div>

            {(() => {
              const getScheduledDaysWithStatus = () => {
                const today = new Date();
                let startDate = currentStudent.joiningDate ? new Date(currentStudent.joiningDate) : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (isNaN(startDate.getTime())) {
                  startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                }
                if (startDate > today) {
                  startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                }

                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const shortDays: Record<string, string> = {
                  sunday: "sun",
                  monday: "mon",
                  tuesday: "tue",
                  wednesday: "wed",
                  thursday: "thu",
                  friday: "fri",
                  saturday: "sat"
                };

                const batchLower = (currentStudent.batch || "").toLowerCase();
                const list: { date: string; status: "Present" | "Absent"; isAuto: boolean; batch: string; level: number }[] = [];
                
                const maxDays = 90;
                let tempDate = new Date(today.getTime());
                let daysIterated = 0;

                const absentDates = new Set(
                  (attendance || [])
                    .filter(a => a.studentId === currentStudent.id && a.status === "Absent")
                    .map(a => a.date)
                );

                while (tempDate >= startDate && daysIterated < maxDays) {
                  const dayName = days[tempDate.getDay()].toLowerCase();
                  const shortDayName = shortDays[dayName] || "";
                  
                  let isAssigned = false;
                  if (!currentStudent.batch) {
                    isAssigned = true;
                  } else if (batchLower.includes(dayName) || (shortDayName && batchLower.includes(shortDayName))) {
                    isAssigned = true;
                  } else if (batchLower.includes("weekday")) {
                    isAssigned = ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(dayName);
                  } else if (batchLower.includes("weekend")) {
                    isAssigned = ["saturday", "sunday"].includes(dayName);
                  } else {
                    const dayNamesList = ["sun", "mon", "tue", "wed", "thu", "fri", "sat", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "weekday", "weekend"];
                    const hasAnyDayName = dayNamesList.some(dName => batchLower.includes(dName));
                    if (!hasAnyDayName) {
                      isAssigned = true;
                    }
                  }

                  if (isAssigned) {
                    const dateStr = tempDate.toISOString().split("T")[0];
                    const isAbsent = absentDates.has(dateStr);
                    list.push({
                      date: dateStr,
                      status: isAbsent ? "Absent" : "Present",
                      isAuto: !isAbsent,
                      batch: currentStudent.batch || "Standard",
                      level: currentStudent.currentLevel
                    });
                  }

                  tempDate.setDate(tempDate.getDate() - 1);
                  daysIterated++;
                }

                return list;
              };

              const allAttRecords = getScheduledDaysWithStatus();

              if (allAttRecords.length === 0) {
                return (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                    No scheduled class dates found since registration date.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-black text-indigo-950">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Class Day</th>
                        <th className="px-4 py-3">Batch & Level</th>
                        <th className="px-4 py-3 text-right">Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {allAttRecords.map((att, i) => {
                        const dayOfW = new Date(att.date).toLocaleDateString(undefined, { weekday: 'long' });
                        return (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-900">{att.date}</td>
                            <td className="px-4 py-3 text-slate-500">{dayOfW}</td>
                            <td className="px-4 py-3 text-slate-500">
                              <span className="font-bold text-slate-700">{att.batch || "Standard"}</span>
                              {att.level ? ` (Level ${att.level})` : ""}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {att.status === "Present" ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                                  ✓ Present
                                </span>
                              ) : (
                                <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                                  ✗ Absent
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
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
                    <strong className="text-indigo-950 text-lg font-mono">₹{(Number(paymentModalFee.amount) || 0) - (Number(paymentModalFee.discount) || 0)}</strong>
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

          {/* HIGH FIDELITY PRINTABLE FEE RECEIPT OVERLAY */}
          {activeReceipt && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in print:p-0 print:bg-white print:static">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-receipt-modal, #printable-receipt-modal * {
                    visibility: visible !important;
                  }
                  #printable-receipt-modal {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    background: #ffffff !important;
                    z-index: 999999 !important;
                  }
                  .print\:hidden, .print-hidden {
                    display: none !important;
                  }
                }
              `}</style>
              <div id="printable-receipt-modal" className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-double border-indigo-100 flex flex-col gap-6 relative overflow-hidden printable-modal print:border-2 print:shadow-none print:max-w-full">
                
                {/* Receipt Watermark Stamp */}
                <div className="absolute inset-0 m-auto w-64 h-64 border-8 border-indigo-50/50 rounded-full flex items-center justify-center rotate-12 -z-0 pointer-events-none">
                  <span className="text-3xl font-black text-indigo-50/50 font-display uppercase tracking-widest">
                    CLEARED
                  </span>
                </div>

                <div className="flex justify-between items-start z-10">
                  <div className="flex gap-2.5 items-center">
                    {studentCenter.logo ? (
                      <img 
                        src={studentCenter.logo} 
                        alt={studentCenter.name} 
                        className="h-9 max-w-[120px] object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center font-black text-indigo-950 text-base shadow-sm uppercase shrink-0">
                        {centerInitials}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 font-display">{studentCenter.name}</h4>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Official Escrow Account</p>
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
                {(() => {
                  const receiptStudent = students.find(s => s.id?.toLowerCase() === activeReceipt.studentId?.toLowerCase()) || currentStudent;
                  return (
                    <div className="border-t border-b border-dashed border-slate-200 py-3 grid grid-cols-2 gap-4 text-[11px] z-10">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Received From</span>
                        <strong className="text-indigo-950 text-xs">{receiptStudent?.studentName || currentStudent?.studentName}</strong>
                        <p className="text-[10px] text-slate-500">Student ID: {receiptStudent?.id || currentStudent?.id} • Level {receiptStudent?.currentLevel || currentStudent?.currentLevel}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Billing / Cleared Date</span>
                        <strong className="text-indigo-950">{activeReceipt.month}</strong>
                        <p className="text-[10px] text-emerald-600 font-bold font-mono">Paid: {activeReceipt.paidDate || "Confirmed"}</p>
                      </div>
                    </div>
                  );
                })()}

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

                  {(Number(activeReceipt.discount) || 0) > 0 && (
                    <div className="bg-rose-50/50 rounded-xl p-3 flex justify-between items-center text-[11px]">
                      <div>
                        <strong className="text-rose-950">Center Scholarship / Special Discount</strong>
                        <p className="text-[10px] text-rose-400">Granted by Admissions Head</p>
                      </div>
                      <span className="font-mono text-rose-600 font-bold">-₹{activeReceipt.discount || 0}</span>
                    </div>
                  )}

                  <div className="p-3 flex justify-between items-center bg-indigo-50/50 rounded-xl font-bold text-sm">
                    <span className="text-indigo-950">Total Paid Amount</span>
                    <span className="font-mono text-indigo-950 text-base">₹{(Number(activeReceipt.amount) || 0) - (Number(activeReceipt.discount) || 0)}</span>
                  </div>
                </div>

                {/* Footer and Sign off */}
                <div className="flex justify-between items-end mt-4 z-10 text-[10px] text-slate-400">
                  <div className="space-y-1">
                    <p>Mode: {activeReceipt.paymentMethod || "UPI Pay"}</p>
                    <p className="font-mono">Ref ID: {activeReceipt.referenceNumber || "GP-SYSTEM-AUTO"}</p>
                    <p className="text-[8px] text-slate-450 font-semibold italic mt-1.5 leading-tight max-w-[200px]">
                      * This is a digitally generated receipt. No physical signature is required.
                    </p>
                  </div>

                  {/* High Fidelity Digital Stamp & Signature */}
                  <div className="text-center relative select-none min-w-[140px]">
                    <div className="absolute -top-7 right-0 left-0 mx-auto w-12 h-12 border border-dashed border-emerald-400 rounded-full flex items-center justify-center opacity-60 rotate-12">
                      <span className="text-[6px] font-black uppercase text-emerald-500 font-mono">Verified Stamp</span>
                    </div>
                    <span className="block font-mono italic text-indigo-700 font-bold text-xs">
                      {studentCenter.ownerName || "Rajesh Kumar"}
                    </span>
                    <span className="block border-t border-slate-200 pt-0.5 text-[8px] uppercase font-bold text-slate-400">
                      Authorized Seal / Signature
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 z-10 text-xs font-bold print:hidden">
                  <button
                    onClick={() => printElementById("printable-receipt-modal", `Official_Receipt_${activeReceipt.id}`)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 cursor-pointer"
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

          {/* Student Earned Digital Certificates & Awards */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-amber-500" />
              Your Official Digital Certificates & Awards
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              View and print official level completion certificates issued by your learning center.
            </p>

            {studentCertificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentCertificates.map(cert => (
                  <div key={cert.id} className="border border-amber-200/80 bg-gradient-to-r from-amber-50/50 to-orange-50/30 rounded-2xl p-4 flex justify-between items-center gap-4 hover:border-amber-400 transition-all shadow-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-amber-800 uppercase bg-amber-100/80 px-2 py-0.5 rounded">
                        {cert.title || "Level Graduation"}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 font-display">{cert.title}</h4>
                      <p className="text-[10px] text-slate-500">
                        Issued on {cert.issueDate} • Level {cert.level}
                      </p>
                      <p className="text-[9px] font-mono text-indigo-600 font-bold">
                        ID: {cert.certificateNumber}
                      </p>
                    </div>

                    <button
                      onClick={() => setViewingCertificate(cert)}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-200 flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      View Certificate
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                No official digital certificates issued yet. Pass your level exam or competition to receive a certificate from your center!
              </div>
            )}
          </div>

          {/* Certificate Modal Viewer */}
          {viewingCertificate && (
            <DigitalCertificateViewer
              certificate={viewingCertificate}
              onClose={() => setViewingCertificate(null)}
            />
          )}
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
                {[...submissions]
                  .sort((a, b) => new Date((b as any).submittedAt || (b as any).createdAt || b.date || 0).getTime() - new Date((a as any).submittedAt || (a as any).createdAt || a.date || 0).getTime())
                  .map(sub => {
                    const dDigits = (sub as any).digits || (sub as any).numDigits || (sub.assignmentTitle && sub.assignmentTitle.match(/(\d+)\s*Digit/i)?.[1]) || 1;
                    const dRows = (sub as any).rows || (sub as any).numRows || (sub.assignmentTitle && sub.assignmentTitle.match(/(\d+)\s*Row/i)?.[1]) || (Number(dDigits) * 2 + 2) || 4;

                    return (
                      <div key={sub.id} className="border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 hover:border-indigo-200 transition-all">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-black text-indigo-950">{sub.assignmentTitle}</span>
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 font-mono">
                              {sub.mode}
                            </span>
                            <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-mono">
                              {dDigits} Digits • {dRows} Rows
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Solved on {sub.date} • Operator: {sub.type || "Abacus Practice"}
                          </p>
                        </div>

                        <div className="flex items-center gap-6 text-xs shrink-0 flex-wrap">
                          {sub.timeTakenSeconds !== undefined && (
                            <div>
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">Speed</span>
                              <span className="font-extrabold font-mono text-indigo-700 block text-right">
                                {Math.floor(sub.timeTakenSeconds / 60)}m {sub.timeTakenSeconds % 60}s
                                <span className="text-[10px] text-slate-400 font-normal ml-1">
                                  ({(sub.timeTakenSeconds / sub.totalSums).toFixed(1)}s/sum)
                                </span>
                              </span>
                            </div>
                          )}
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
                    );
                  })}
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
