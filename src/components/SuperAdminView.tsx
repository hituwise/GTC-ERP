import React, { useState, useEffect } from "react";
import { Center, Student, Teacher, CRMLead, FeeRecord, ExpenseRecord, AttendanceRecord, HomeworkRecord, TeacherTrainee, TeacherCourse, TeacherCourseModule, TeacherCourseLesson } from "../types";
import { Building2, PlusCircle, ShieldCheck, Mail, Calendar, Sparkles, TrendingUp, DollarSign, Megaphone, CheckCircle, RefreshCw, Key, ShieldAlert, Edit, Trash2, ClipboardCopy, Check, Users, Award, Trophy, Star, MessageSquare, Send, CreditCard, Clock, Landmark, BookOpen, ClipboardList, Calculator, Package, Truck, Eye, Settings2, Image, Globe, GraduationCap, Play, Rocket, Lock, Unlock, CheckCircle2, AlertCircle, Video, Activity } from "lucide-react";
import { AccountingView } from "./AccountingView";
import VirtualAbacus from "./VirtualAbacus";
import PracticeGeneratorView from "./PracticeGeneratorView";
import { SystemDiagnosticsView } from "./SystemDiagnosticsView";

export interface SubscriptionPlan {
  id: string;
  name: string;
  planType?: string;
  maxStudents: number | "Unlimited";
  maxTeachers?: number | "Unlimited";
  maxStaff?: number | "Unlimited";
  maxCenters?: number | "Unlimited";
  price: number;
  features: string[];
  status: "Active" | "Inactive";
  billingCycle?: "Monthly" | "Annually";
}

export interface SaaSInvoice {
  id: string;
  centerId: string;
  centerName: string;
  planName: string;
  amount: number;
  dueDate: string;
  issuedDate: string;
  status: "Paid" | "Unpaid" | "Overdue";
  paymentMode?: "UPI" | "NetBanking" | "Cash" | "Check" | "Other";
  referenceId?: string;
  paidDate?: string;
}

export interface SuperAdminViewProps {
  centers: Center[];
  onAddCenter: (newCenter: Center) => void;
  students?: Student[];
  teachers?: Teacher[];
  teacherTrainees?: TeacherTrainee[];
  leads?: CRMLead[];
  fees?: FeeRecord[];
  expenses?: ExpenseRecord[];
  attendance?: AttendanceRecord[];
  homework?: HomeworkRecord[];
  studentFeePlans?: any[];
  onUpdateStudentFeePlan?: (id: string, monthlyFee: number) => void;
  activityLogs?: any[];
  materialProducts?: any[];
  materialOrders?: any[];
  shippingSettings?: any;
  onRefreshData?: () => void;
}

export default function SuperAdminView({
  centers: initialCenters,
  onAddCenter,
  students = [],
  teachers = [],
  teacherTrainees = [],
  leads = [],
  fees = [],
  expenses = [],
  attendance = [],
  homework = [],
  studentFeePlans = [],
  onUpdateStudentFeePlan,
  activityLogs = [],
  materialProducts = [],
  materialOrders = [],
  shippingSettings,
  onRefreshData
}: SuperAdminViewProps) {
  const [centers, setCenters] = useState<Center[]>(initialCenters);
  const [showAddCenter, setShowAddCenter] = useState(false);

  // Active Sub-Tab State
  const [activeTab, setActiveTab] = useState<"analytics" | "centers" | "teachers" | "plans" | "payments" | "logs" | "accounting" | "inventory" | "landing_cms" | "teacher_training" | "diagnostics">("analytics");

  // Teacher Training & 1-Month Trial CRM States
  const [trainees, setTrainees] = useState<TeacherTrainee[]>(teacherTrainees);
  const [showAddTraineeModal, setShowAddTraineeModal] = useState(false);
  const [traineeSearch, setTraineeSearch] = useState("");
  const [newTraineeName, setNewTraineeName] = useState("");
  const [newTraineeEmail, setNewTraineeEmail] = useState("");
  const [newTraineeMobile, setNewTraineeMobile] = useState("");
  const [newTraineeCity, setNewTraineeCity] = useState("");
  const [newTraineeState, setNewTraineeState] = useState("");
  const [newTraineeLevel, setNewTraineeLevel] = useState<number>(1);
  const [newTraineeEnrollmentType, setNewTraineeEnrollmentType] = useState<"recorded_course" | "live_batch">("recorded_course");
  const [newTraineeBatch, setNewTraineeBatch] = useState<string>("Batch 001");
  const [newTraineeStudentAccess, setNewTraineeStudentAccess] = useState(true);
  const [newTraineeNotes, setNewTraineeNotes] = useState("");
  const [isSavingTrainee, setIsSavingTrainee] = useState(false);

  // Trial CRM Modal State
  const [trialSuccessModal, setTrialSuccessModal] = useState<any | null>(null);
  const [activatingTrialId, setActivatingTrialId] = useState<string | null>(null);

  // LMS Teacher Training Sub-tab & Course States
  const [teacherTrainingSubTab, setTeacherTrainingSubTab] = useState<"roster" | "lms_courses" | "live_batches" | "abacus_smartboard" | "worksheet_generator">("roster");
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [courseCategoryFilter, setCourseCategoryFilter] = useState<string>("All");
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TeacherCourse | null>(null);
  const [selectedCoursePreview, setSelectedCoursePreview] = useState<TeacherCourse | null>(null);

  // Live Batch States
  const [liveBatches, setLiveBatches] = useState<any[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [batchCode, setBatchCode] = useState("Batch 003");
  const [batchTitle, setBatchTitle] = useState("");
  const [batchInstructor, setBatchInstructor] = useState("Master Abacus Trainer");
  const [batchSchedule, setBatchSchedule] = useState("Mon & Wed 10:00 AM - 11:30 AM IST");
  const [batchStartDate, setBatchStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [batchEndDate, setBatchEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [batchMeetUrl, setBatchMeetUrl] = useState("https://meet.google.com/abc-defg-hij");
  const [batchNotes, setBatchNotes] = useState("");
  const [batchStatus, setBatchStatus] = useState<"Active" | "Upcoming" | "Completed">("Active");
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  
  // Course Form Fields
  const [courseTitle, setCourseTitle] = useState("");
  const [courseLevel, setCourseLevel] = useState<number>(1);
  const [courseCategory, setCourseCategory] = useState<string>("Pedagogy & Finger Methods");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseDurationHours, setCourseDurationHours] = useState<number>(10);
  const [courseIsPublished, setCourseIsPublished] = useState(true);
  const [courseModules, setCourseModules] = useState<TeacherCourseModule[]>([]);
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Lesson Builder Modal States
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string>("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<"video" | "manual_pdf" | "guide" | "lesson_plan" | "quiz">("video");
  const [lessonUrl, setLessonUrl] = useState("");
  const [lessonText, setLessonText] = useState("");
  const [lessonDuration, setLessonDuration] = useState<number>(15);
  const [quizQuestions, setQuizQuestions] = useState<{ question: string; options: string[]; correctIndex: number }[]>([]);

  useEffect(() => {
    if (teacherTrainees && teacherTrainees.length > 0) {
      setTrainees(teacherTrainees);
    }
  }, [teacherTrainees]);

  useEffect(() => {
    fetch("/api/erp/teacher-training/courses")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.courses) {
          setCourses(data.courses);
        }
      })
      .catch(err => console.error("Error fetching courses:", err));

    fetch("/api/erp/teacher-training/live-batches")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.liveBatches) {
          setLiveBatches(data.liveBatches);
        }
      })
      .catch(err => console.error("Error fetching live batches:", err));
  }, []);

  const handleOpenBatchModal = (batch?: any) => {
    if (batch) {
      setEditingBatch(batch);
      setBatchCode(batch.batchCode);
      setBatchTitle(batch.title);
      setBatchInstructor(batch.instructorName || "Master Abacus Trainer");
      setBatchSchedule(batch.scheduleTime || "Mon & Wed 10:00 AM");
      setBatchStartDate(batch.startDate || new Date().toISOString().split("T")[0]);
      setBatchEndDate(batch.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
      setBatchMeetUrl(batch.meetUrl || "https://meet.google.com/abc-defg-hij");
      setBatchNotes(batch.notes || "");
      setBatchStatus(batch.status || "Active");
    } else {
      setEditingBatch(null);
      setBatchCode(`Batch 00${liveBatches.length + 1}`);
      setBatchTitle("Live Abacus Teacher Certification Cohort");
      setBatchInstructor("Master Abacus Trainer");
      setBatchSchedule("Tue & Thu 05:00 PM - 06:30 PM IST");
      setBatchStartDate(new Date().toISOString().split("T")[0]);
      setBatchEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
      setBatchMeetUrl("https://meet.google.com/abc-defg-hij");
      setBatchNotes("Interactive live training batch covering finger pedagogy, parent demo pitching, and speed drills.");
      setBatchStatus("Active");
    }
    setShowBatchModal(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchCode || !batchTitle) return;
    setIsSavingBatch(true);
    try {
      const res = await fetch("/api/erp/teacher-training/live-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBatch ? editingBatch.id : undefined,
          batchCode,
          title: batchTitle,
          instructorName: batchInstructor,
          scheduleTime: batchSchedule,
          startDate: batchStartDate,
          endDate: batchEndDate,
          meetUrl: batchMeetUrl,
          notes: batchNotes,
          status: batchStatus
        })
      });
      const data = await res.json();
      if (data.success && data.liveBatches) {
        setLiveBatches(data.liveBatches);
        setShowBatchModal(false);
      } else {
        alert(data.error || "Failed to save batch.");
      }
    } catch (err) {
      console.error("Error saving batch:", err);
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleOpenCourseModal = (course?: TeacherCourse) => {
    if (course) {
      setEditingCourse(course);
      setCourseTitle(course.title);
      setCourseLevel(course.level || 1);
      setCourseCategory(course.category || "Pedagogy & Finger Methods");
      setCourseDescription(course.description || "");
      setCourseDurationHours(course.durationHours || 10);
      setCourseIsPublished(course.isPublished !== undefined ? course.isPublished : true);
      setCourseModules(course.modules ? JSON.parse(JSON.stringify(course.modules)) : []);
    } else {
      setEditingCourse(null);
      setCourseTitle("");
      setCourseLevel(1);
      setCourseCategory("Pedagogy & Finger Methods");
      setCourseDescription("");
      setCourseDurationHours(10);
      setCourseIsPublished(true);
      setCourseModules([
        {
          id: `MOD_${Date.now().toString().slice(-4)}`,
          title: `Unit 1: Foundational Pedagogy & Finger Drills`,
          description: "Understanding physical bead placement, posture, and speed rules.",
          level: 1,
          lessons: [
            {
              id: `LES_${Date.now().toString().slice(-4)}`,
              title: "Physical Bead Movement & Finger Drill Video",
              type: "video",
              contentUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              textContent: "Always use Thumb for lower beads UP and Index finger for lower beads DOWN.",
              durationMinutes: 20
            }
          ]
        }
      ]);
    }
    setShowAddCourseModal(true);
  };

  const handleAddModule = () => {
    const modTitle = prompt("Enter Unit / Module Title:", `Unit ${courseModules.length + 1}: Abacus Teaching Methodology`);
    if (!modTitle) return;
    const modDesc = prompt("Enter Module Description:", "Pedagogy guidelines and sum demonstrations.") || "";
    const newMod: TeacherCourseModule = {
      id: `MOD_${Date.now().toString().slice(-4)}_${Math.random().toString(36).substring(2, 5)}`,
      title: modTitle,
      description: modDesc,
      level: courseLevel,
      lessons: []
    };
    setCourseModules([...courseModules, newMod]);
  };

  const handleDeleteModule = (modId: string) => {
    if (!window.confirm("Are you sure you want to delete this module and all its lessons?")) return;
    setCourseModules(courseModules.filter(m => m.id !== modId));
  };

  const handleOpenLessonModal = (moduleId: string, lesson?: TeacherCourseLesson) => {
    setTargetModuleId(moduleId);
    if (lesson) {
      setEditingLessonId(lesson.id);
      setLessonTitle(lesson.title);
      setLessonType(lesson.type);
      setLessonUrl(lesson.contentUrl || "");
      setLessonText(lesson.textContent || "");
      setLessonDuration(lesson.durationMinutes || 15);
      setQuizQuestions(lesson.quizQuestions ? JSON.parse(JSON.stringify(lesson.quizQuestions)) : []);
    } else {
      setEditingLessonId(null);
      setLessonTitle("");
      setLessonType("video");
      setLessonUrl("");
      setLessonText("");
      setLessonDuration(15);
      setQuizQuestions([
        {
          question: "Which finger is used to move the upper bead (value 5) DOWN?",
          options: ["Index Finger", "Thumb Finger", "Middle Finger", "Ring Finger"],
          correctIndex: 0
        }
      ]);
    }
    setShowAddLessonModal(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim()) {
      alert("Please provide lesson title.");
      return;
    }

    const updatedModules = courseModules.map(mod => {
      if (mod.id !== targetModuleId) return mod;

      let lessons = mod.lessons || [];
      if (editingLessonId) {
        lessons = lessons.map(les => {
          if (les.id !== editingLessonId) return les;
          return {
            ...les,
            title: lessonTitle,
            type: lessonType,
            contentUrl: lessonUrl,
            textContent: lessonText,
            durationMinutes: lessonDuration,
            quizQuestions: lessonType === "quiz" ? quizQuestions : undefined
          };
        });
      } else {
        const newLes: TeacherCourseLesson = {
          id: `LES_${Date.now().toString().slice(-4)}_${Math.random().toString(36).substring(2, 5)}`,
          title: lessonTitle,
          type: lessonType,
          contentUrl: lessonUrl,
          textContent: lessonText,
          durationMinutes: lessonDuration,
          quizQuestions: lessonType === "quiz" ? quizQuestions : undefined
        };
        lessons.push(newLes);
      }

      return { ...mod, lessons };
    });

    setCourseModules(updatedModules);
    setShowAddLessonModal(false);
  };

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    if (!window.confirm("Delete this lesson?")) return;
    setCourseModules(courseModules.map(m => {
      if (m.id !== moduleId) return m;
      return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
    }));
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      alert("Please provide course title.");
      return;
    }
    setIsSavingCourse(true);
    try {
      const res = await fetch("/api/erp/teacher-training/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCourse ? editingCourse.id : undefined,
          title: courseTitle,
          level: courseLevel,
          category: courseCategory,
          description: courseDescription,
          durationHours: courseDurationHours,
          isPublished: courseIsPublished,
          modules: courseModules
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Teacher Course saved successfully!");
        setShowAddCourseModal(false);
        if (data.courses) setCourses(data.courses);
        if (onRefreshData) onRefreshData();
      } else {
        alert(data.error || "Failed to save course.");
      }
    } catch (err: any) {
      alert("Error saving course: " + err.message);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this teacher training course?")) return;
    try {
      const res = await fetch(`/api/erp/teacher-training/courses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success && data.courses) {
        setCourses(data.courses);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Error deleting course:", err);
    }
  };

  const handleAssignCourseToAll = async (courseTitleStr: string) => {
    try {
      const res = await fetch("/api/erp/teacher-training/assign-course-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseTitle: courseTitleStr })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Assigned '${courseTitleStr}' to all teacher trainees!`);
        if (data.trainees) setTrainees(data.trainees);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Error assigning course to all:", err);
    }
  };

  // Teacher Training Action Handlers
  const handleSaveTrainee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraineeName.trim() || !newTraineeEmail.trim()) {
      alert("Please provide trainee name and email.");
      return;
    }
    setIsSavingTrainee(true);
    try {
      const res = await fetch("/api/erp/teacher-training/trainees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTraineeName,
          email: newTraineeEmail,
          mobile: newTraineeMobile || "9876543210",
          city: newTraineeCity || "City",
          state: newTraineeState || "State",
          currentTrainingLevel: newTraineeLevel,
          enrollmentType: newTraineeEnrollmentType,
          enrolledBatch: newTraineeEnrollmentType === "live_batch" ? newTraineeBatch : undefined,
          studentPortalAccess: newTraineeStudentAccess,
          notes: newTraineeNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Teacher trainee registered successfully!");
        setShowAddTraineeModal(false);
        setNewTraineeName(""); setNewTraineeEmail(""); setNewTraineeMobile("");
        setNewTraineeCity(""); setNewTraineeState(""); setNewTraineeNotes("");
        if (data.trainees) setTrainees(data.trainees);
        if (onRefreshData) onRefreshData();
      } else {
        alert(data.error || "Failed to save trainee.");
      }
    } catch (err: any) {
      alert("Error saving trainee: " + err.message);
    } finally {
      setIsSavingTrainee(false);
    }
  };

  const handleActivateTrial = async (trainee: TeacherTrainee) => {
    setActivatingTrialId(trainee.id);
    try {
      const res = await fetch("/api/erp/teacher-training/activate-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traineeId: trainee.id,
          centerName: `${trainee.name}'s Abacus Academy (30-Day Trial)`,
          ownerName: trainee.name,
          email: trainee.email,
          mobile: trainee.mobile
        })
      });
      const data = await res.json();
      if (data.success) {
        setTrialSuccessModal({
          traineeName: trainee.name,
          centerName: data.trialCenter.name,
          email: data.loginCredentials.email,
          password: data.loginCredentials.password,
          centerId: data.loginCredentials.centerId,
          trialEndsAt: data.trialEndsAt
        });
        if (onRefreshData) onRefreshData();
      } else {
        alert(data.error || "Failed to activate 1-Month Trial CRM.");
      }
    } catch (err: any) {
      alert("Error activating trial CRM: " + err.message);
    } finally {
      setActivatingTrialId(null);
    }
  };

  const handleToggleTraineeStudentAccess = async (trainee: TeacherTrainee) => {
    const updatedAccess = !trainee.studentPortalAccess;
    try {
      const res = await fetch("/api/erp/teacher-training/trainees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: trainee.id,
          name: trainee.name,
          email: trainee.email,
          studentPortalAccess: updatedAccess
        })
      });
      const data = await res.json();
      if (data.success && data.trainees) {
        setTrainees(data.trainees);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Error toggling trainee student access:", err);
    }
  };

  const handleUpdateTraineeLevel = async (trainee: TeacherTrainee, level: number) => {
    try {
      const res = await fetch("/api/erp/teacher-training/trainees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: trainee.id,
          name: trainee.name,
          email: trainee.email,
          currentTrainingLevel: level
        })
      });
      const data = await res.json();
      if (data.success && data.trainees) {
        setTrainees(data.trainees);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Error updating trainee level:", err);
    }
  };

  const handleDeleteTrainee = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this teacher trainee?")) return;
    try {
      const res = await fetch(`/api/erp/teacher-training/trainees/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success && data.trainees) {
        setTrainees(data.trainees);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Error deleting trainee:", err);
    }
  };


  // Teacher multi-center assignment modal states
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editTeacherCenterIds, setEditTeacherCenterIds] = useState<string[]>([]);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherMobile, setNewTeacherMobile] = useState("");
  const [newTeacherRole, setNewTeacherRole] = useState("Senior Abacus Trainer");
  const [newTeacherCenterIds, setNewTeacherCenterIds] = useState<string[]>([]);

  // Landing Page CMS States
  const [cmsHeadline, setCmsHeadline] = useState("Empower Young Minds With Master Abacus Genius Training");
  const [cmsSubtitle, setCmsSubtitle] = useState("India's #1 Rated Abacus & Vedic Mathematics Learning Suite. Empowering 10,000+ students with 10x mental math speed.");
  const [cmsHeroImage, setCmsHeroImage] = useState("https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80");
  const [cmsPrimaryCta, setCmsPrimaryCta] = useState("Book Free Live Demo Class");
  const [cmsSecondaryCta, setCmsSecondaryCta] = useState("Try Live Speed Drills");
  const [cmsContactPhone, setCmsContactPhone] = useState("+91 98765 43210");
  const [cmsContactEmail, setCmsContactEmail] = useState("support@abacusgenius.com");
  const [cmsAddress, setCmsAddress] = useState("Headquarters: Genius Towers, Tech City, India");
  const [cmsFooterTitle, setCmsFooterTitle] = useState("Abacus Genius Academy");
  const [cmsFooterDesc, setCmsFooterDesc] = useState("Empowering the next generation of mental math champions with live online interactive classes.");
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsSuccess, setCmsSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/erp/landing-config")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          const cfg = data.config;
          if (cfg.heroHeadline) setCmsHeadline(cfg.heroHeadline);
          if (cfg.heroSubtitle) setCmsSubtitle(cfg.heroSubtitle);
          if (cfg.heroImage) setCmsHeroImage(cfg.heroImage);
          if (cfg.primaryCtaText) setCmsPrimaryCta(cfg.primaryCtaText);
          if (cfg.secondaryCtaText) setCmsSecondaryCta(cfg.secondaryCtaText);
          if (cfg.contactPhone) setCmsContactPhone(cfg.contactPhone);
          if (cfg.contactEmail) setCmsContactEmail(cfg.contactEmail);
          if (cfg.address) setCmsAddress(cfg.address);
          if (cfg.footerTitle) setCmsFooterTitle(cfg.footerTitle);
          if (cfg.footerDescription) setCmsFooterDesc(cfg.footerDescription);
        }
      })
      .catch(e => console.error("Error fetching landing config", e));
  }, []);

  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmsSaving(true);
    try {
      const res = await fetch("/api/erp/landing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroHeadline: cmsHeadline,
          heroSubtitle: cmsSubtitle,
          heroImage: cmsHeroImage,
          primaryCtaText: cmsPrimaryCta,
          secondaryCtaText: cmsSecondaryCta,
          contactPhone: cmsContactPhone,
          contactEmail: cmsContactEmail,
          address: cmsAddress,
          footerTitle: cmsFooterTitle,
          footerDescription: cmsFooterDesc
        })
      });
      const data = await res.json();
      if (data.success) {
        setCmsSuccess(true);
        setTimeout(() => setCmsSuccess(false), 3000);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Error saving CMS config:", err);
    } finally {
      setCmsSaving(false);
    }
  };

  // Material Inventory & Ordering Workspace State
  const [invSubTab, setInvSubTab] = useState<"products" | "orders" | "shipping">("products");
  
  // Product Modal Fields
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState(0);
  const [prodWeight, setProdWeight] = useState(0);
  const [prodStock, setProdStock] = useState(0);
  const [prodLink, setProdLink] = useState("");
  const [prodImage, setProdImage] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Shipping Rules Configuration
  const [shipBaseLimit, setShipBaseLimit] = useState(500);
  const [shipBaseCharge, setShipBaseCharge] = useState(60);
  const [shipStep, setShipStep] = useState(500);
  const [shipStepCharge, setShipStepCharge] = useState(40);
  const [shippingSaveSuccess, setShippingSaveSuccess] = useState(false);

  // Sync shipping fields when prop loads/updates
  React.useEffect(() => {
    if (shippingSettings) {
      setShipBaseLimit(shippingSettings.baseWeightLimit || 500);
      setShipBaseCharge(shippingSettings.baseShippingCharge || 60);
      setShipStep(shippingSettings.additionalWeightStep || 500);
      setShipStepCharge(shippingSettings.additionalShippingCharge || 40);
    }
  }, [shippingSettings]);

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const payload = {
      name: prodName,
      description: prodDesc,
      price: Number(prodPrice) || 0,
      weight: Number(prodWeight) || 0,
      stock: Number(prodStock) || 0,
      orderLink: prodLink,
      image: prodImage
    };

    try {
      const url = editingProduct
        ? `/api/erp/inventory/product/${editingProduct.id}`
        : `/api/erp/inventory/product`;
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowProductModal(false);
        setEditingProduct(null);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Error saving product:", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/erp/inventory/product/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleSaveShippingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/erp/inventory/shipping-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseWeightLimit: Number(shipBaseLimit),
          baseShippingCharge: Number(shipBaseCharge),
          additionalWeightStep: Number(shipStep),
          additionalShippingCharge: Number(shipStepCharge)
        })
      });
      const data = await res.json();
      if (data.success) {
        setShippingSaveSuccess(true);
        setTimeout(() => setShippingSaveSuccess(false), 3000);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Error saving shipping settings:", err);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string, paymentStatus: string, trackingNumber: string) => {
    setUpdatingOrderId(id);
    try {
      const res = await fetch(`/api/erp/inventory/order-status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentStatus, trackingNumber })
      });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // SaaS Plans state
  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => {
    const saved = localStorage.getItem("superadmin_saas_plans");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: "p1", name: "10 Students Plan (Annual)", maxStudents: 10, price: 9999, features: ["Up to 10 Students roster", "Active Student Dashboard", "Standard Lead Desk & CRM"], status: "Active", billingCycle: "Annually" },
      { id: "p2", name: "20 Students Plan (Annual)", maxStudents: 20, price: 18999, features: ["Up to 20 Students roster", "Unlimited Practice Worksheets", "Complete Lead Flow Desk & CRM"], status: "Active", billingCycle: "Annually" },
      { id: "p3", name: "40 Students Plan (Annual)", maxStudents: 40, price: 26999, features: ["Up to 40 Students roster", "Auto-generated Practice Sheets", "Multiple Addresses / Branches"], status: "Active", billingCycle: "Annually" },
      { id: "p4", name: "100 Students Plan (Annual)", maxStudents: 100, price: 49999, features: ["Up to 100 Students roster", "Dedicated Counselor Desk", "Full P&L and Expense Reports"], status: "Active", billingCycle: "Annually" },
      { id: "p_m1", name: "10 Students Plan (Monthly)", maxStudents: 10, price: 999, features: ["Up to 10 Students roster", "Active Student Dashboard", "Standard Lead Desk & CRM"], status: "Active", billingCycle: "Monthly" },
      { id: "p_m2", name: "20 Students Plan (Monthly)", maxStudents: 20, price: 1899, features: ["Up to 20 Students roster", "Unlimited Practice Worksheets", "Complete Lead Flow Desk & CRM"], status: "Active", billingCycle: "Monthly" },
      { id: "p_m3", name: "40 Students Plan (Monthly)", maxStudents: 40, price: 2699, features: ["Up to 40 Students roster", "Auto-generated Practice Sheets", "Multiple Addresses / Branches"], status: "Active", billingCycle: "Monthly" },
      { id: "p5", name: "Custom Plan", maxStudents: "Unlimited", price: 99999, features: ["Unlimited Students", "Custom Branding Enabled", "Superadmin Direct Database Export"], status: "Active", billingCycle: "Annually" }
    ];
  });

  const [catalogCycleFilter, setCatalogCycleFilter] = useState<"All" | "Monthly" | "Annually">("All");

  useEffect(() => {
    localStorage.setItem("superadmin_saas_plans", JSON.stringify(plans));
  }, [plans]);

  // Plan Creator Form hooks
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanType, setNewPlanType] = useState<"Standard Center" | "Multi-Center / Super Center">("Standard Center");
  const [newPlanMaxStudents, setNewPlanMaxStudents] = useState("300");
  const [newPlanMaxTeachers, setNewPlanMaxTeachers] = useState("20");
  const [newPlanMaxStaff, setNewPlanMaxStaff] = useState("10");
  const [newPlanMaxCenters, setNewPlanMaxCenters] = useState("5");
  const [newPlanPrice, setNewPlanPrice] = useState("");
  const [newPlanFeatures, setNewPlanFeatures] = useState("");
  const [newPlanBillingCycle, setNewPlanBillingCycle] = useState<"Monthly" | "Annually">("Annually");
  const [planSuccessMsg, setPlanSuccessMsg] = useState("");

  // Super Admin Activity Log Filter States
  const [logFilterDate, setLogFilterDate] = useState("");
  const [logFilterUser, setLogFilterUser] = useState("");
  const [logFilterAction, setLogFilterAction] = useState("");
  const [logFilterCenter, setLogFilterCenter] = useState("");

  // Super Admin SaaS Payment & Banking Details State
  const [saasHolderName, setSaasHolderName] = useState(() => {
    return localStorage.getItem("superadmin_holder_name") || "GENIPLUS KIDS ACADEMY";
  });
  const [saasBankName, setSaasBankName] = useState(() => {
    return localStorage.getItem("superadmin_bank_name") || "AXIS BANK";
  });
  const [saasAccountNumber, setSaasAccountNumber] = useState(() => {
    return localStorage.getItem("superadmin_account_number") || "920020055809848";
  });
  const [saasIfscCode, setSaasIfscCode] = useState(() => {
    return localStorage.getItem("superadmin_ifsc_code") || "UTIB0003818";
  });
  const [saasUpiId, setSaasUpiId] = useState(() => {
    return localStorage.getItem("superadmin_upi_id") || "geniplus@axl";
  });
  const [saasPaymentNotes, setSaasPaymentNotes] = useState(() => {
    return localStorage.getItem("superadmin_payment_notes") || "Please mention your Center ID in the transaction description.";
  });
  const [bankSettingsSaved, setBankSettingsSaved] = useState(false);
  const [saasBankLoading, setSaasBankLoading] = useState(false);

  // Load Super Admin bank details from backend on mount
  useEffect(() => {
    const fetchSaaSBankDetails = async () => {
      try {
        const res = await fetch("/api/erp/superadmin-payment-details");
        const data = await res.json();
        if (data.success && data.details) {
          const d = data.details;
          setSaasHolderName(d.holderName);
          setSaasBankName(d.bankName);
          setSaasAccountNumber(d.accountNumber);
          setSaasIfscCode(d.ifscCode);
          setSaasUpiId(d.upiId);
          setSaasPaymentNotes(d.paymentNotes);

          // sync to local storage for instant availability in center admin dashboard
          localStorage.setItem("superadmin_holder_name", d.holderName);
          localStorage.setItem("superadmin_bank_name", d.bankName);
          localStorage.setItem("superadmin_account_number", d.accountNumber);
          localStorage.setItem("superadmin_ifsc_code", d.ifscCode);
          localStorage.setItem("superadmin_upi_id", d.upiId);
          localStorage.setItem("superadmin_payment_notes", d.paymentNotes);
        }
      } catch (err) {
        console.error("Error fetching Super Admin SaaS bank details:", err);
      }
    };
    fetchSaaSBankDetails();
  }, []);

  const handleSaveSaasBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaasBankLoading(true);
    try {
      const res = await fetch("/api/erp/update-superadmin-payment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holderName: saasHolderName,
          bankName: saasBankName,
          accountNumber: saasAccountNumber,
          ifscCode: saasIfscCode,
          upiId: saasUpiId,
          paymentNotes: saasPaymentNotes
        })
      });
      const data = await res.json();
      if (data.success && data.details) {
        setBankSettingsSaved(true);
        localStorage.setItem("superadmin_holder_name", saasHolderName);
        localStorage.setItem("superadmin_bank_name", saasBankName);
        localStorage.setItem("superadmin_account_number", saasAccountNumber);
        localStorage.setItem("superadmin_ifsc_code", saasIfscCode);
        localStorage.setItem("superadmin_upi_id", saasUpiId);
        localStorage.setItem("superadmin_payment_notes", saasPaymentNotes);
        setTimeout(() => setBankSettingsSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save bank details via network, saved locally.");
      localStorage.setItem("superadmin_holder_name", saasHolderName);
      localStorage.setItem("superadmin_bank_name", saasBankName);
      localStorage.setItem("superadmin_account_number", saasAccountNumber);
      localStorage.setItem("superadmin_ifsc_code", saasIfscCode);
      localStorage.setItem("superadmin_upi_id", saasUpiId);
      localStorage.setItem("superadmin_payment_notes", saasPaymentNotes);
      setBankSettingsSaved(true);
      setTimeout(() => setBankSettingsSaved(false), 3000);
    } finally {
      setSaasBankLoading(false);
    }
  };

  // SaaS Invoices & Billings State
  const [invoices, setInvoices] = useState<SaaSInvoice[]>([]);

  // Collect Payment Action states
  const [collectingInvoice, setCollectingInvoice] = useState<SaaSInvoice | null>(null);
  const [payMode, setPayMode] = useState<"UPI" | "NetBanking" | "Cash" | "Check" | "Other">("UPI");
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Invoice manual generation form states
  const [invCenterId, setInvCenterId] = useState("");
  const [invPlanName, setInvPlanName] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invDueDate, setInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [invSuccessMsg, setInvSuccessMsg] = useState("");

  // Edit Center Modal States
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [editName, setEditName] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editPlanType, setEditPlanType] = useState<"Standard Center" | "Multi-Center / Super Center">("Standard Center");
  const [editIsSuperCenter, setEditIsSuperCenter] = useState(false);
  const [editStudentLimit, setEditStudentLimit] = useState("300");
  const [editTeacherLimit, setEditTeacherLimit] = useState("20");
  const [editStaffLimit, setEditStaffLimit] = useState("10");
  const [editCenterLimit, setEditCenterLimit] = useState("5");
  const [editPassword, setEditPassword] = useState("");
  const [editCustomPrice, setEditCustomPrice] = useState("");
  const [editAddresses, setEditAddresses] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  // Edit Invoice States
  const [editingInvoice, setEditingInvoice] = useState<SaaSInvoice | null>(null);
  const [editInvPlanName, setEditInvPlanName] = useState("");
  const [editInvAmount, setEditInvAmount] = useState("");
  const [editInvDueDate, setEditInvDueDate] = useState("");
  const [editInvStatus, setEditInvStatus] = useState<"Paid" | "Unpaid" | "Overdue">("Unpaid");

  // Copy Password Feedback
  const [copiedCenterId, setCopiedCenterId] = useState<string | null>(null);

  // Sync state with master centers prop when it changes
  useEffect(() => {
    setCenters(initialCenters);
  }, [initialCenters]);

  // Load invoices from backend on mount
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const res = await fetch("/api/erp/saas-invoices");
        const data = await res.json();
        if (data.success && data.invoices) {
          setInvoices(data.invoices);
        }
      } catch (err) {
        console.error("Error loading saas invoices:", err);
      }
    };
    loadInvoices();
  }, []);

  // Form Fields for Register Center
  const [cName, setCName] = useState("");
  const [cOwner, setCOwner] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cMobile, setCMobile] = useState("");
  const [cCity, setCCity] = useState("");
  const [cState, setCState] = useState("");
  const [cPlan, setCPlan] = useState("Standard");
  const [cCustomPrice, setCCustomPrice] = useState("");
  const [cAddresses, setCAddresses] = useState<string[]>([""]);

  // Form Fields for Subscription / Trial manager
  const [subCenterId, setSubCenterId] = useState("");
  const [subPlan, setSubPlan] = useState("Standard");
  const [subPlanType, setSubPlanType] = useState<"Predefined" | "Custom">("Predefined");
  const [subCustomStudentLimit, setSubCustomStudentLimit] = useState("25");
  const [subCustomMonthlyPrice, setSubCustomMonthlyPrice] = useState("1299");
  const [subExpiry, setSubExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [subIsTrial, setSubIsTrial] = useState(false);
  const [subTrialDays, setSubTrialDays] = useState(30);
  const [subUpdating, setSubUpdating] = useState(false);

  // New manual billing schedule states for centers
  const [subBillingDate, setSubBillingDate] = useState<number>(1);
  const [subNextRenewalDate, setSubNextRenewalDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [subSubscriptionStatus, setSubSubscriptionStatus] = useState<"Active" | "Expired" | "Suspended">("Active");
  const [subMonthlySubscriptionAmount, setSubMonthlySubscriptionAmount] = useState<string>("999");
  const [subPlanName, setSubPlanName] = useState("Growth Plan");

  // Admin authentication (credential login) states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Announcements
  const [annTitle, setAnnTitle] = useState("");
  const [annText, setAnnText] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([
    { title: "National Abacus Competition 2026", text: "Registrations are now open for Levels 1 to 8. All center heads must share details with parent batches.", date: "2026-07-01" },
    { title: "V4 Curriculum Guidelines Published", text: "The educational rules for Level 1 Direct Bead subtraction are now active in the Practice Generator module.", date: "2026-06-25" }
  ]);
  const [showAnnSuccess, setShowAnnSuccess] = useState(false);

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);

    setTimeout(() => {
      const email = adminEmail.trim().toLowerCase();
      // Superadmin credentials validation: support both generic and realistic accounts
      if (email === "admin@geniplus.com" && (adminPassword === "password123" || adminPassword === "admin123")) {
        setIsLoggedIn(true);
        localStorage.setItem("superadmin_is_logged_in", "true");
      } else {
        setAdminError("Incorrect credentials. Use admin@geniplus.com and password123 to log in.");
      }
      setAdminLoading(false);
    }, 400);
  };

  const handleAdminLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("superadmin_is_logged_in");
    setAdminEmail("");
    setAdminPassword("");
  };

  const handleUpdateSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCenterId) {
      alert("Please select a Venture/Academy center to modify");
      return;
    }
    setSubUpdating(true);

    let finalLimit = 10;
    if (subPlanType === "Predefined") {
      const planName = subPlan.toLowerCase();
      if (planName.includes("starter")) finalLimit = 10;
      else if (planName.includes("growth")) finalLimit = 20;
      else if (planName.includes("professional")) finalLimit = 50;
      else if (planName.includes("premium")) finalLimit = 50;
      else if (planName.includes("enterprise")) finalLimit = 100;
    } else {
      finalLimit = Number(subCustomStudentLimit) || 25;
    }

    try {
      const res = await fetch("/api/erp/update-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: subCenterId,
          planType: subPlanType,
          plan: subPlanType === "Custom" ? `Custom Plan (${finalLimit} Students)` : subPlan,
          studentLimit: finalLimit,
          monthlyPrice: subPlanType === "Custom" ? Number(subCustomMonthlyPrice) : undefined,
          subscriptionExpiry: subExpiry || undefined,
          isTrial: subIsTrial,
          trialDays: subIsTrial ? Number(subTrialDays) : undefined,
          billingDate: Number(subBillingDate) || 5,
          nextRenewalDate: subNextRenewalDate || undefined,
          subscriptionStatus: subSubscriptionStatus,
          monthlySubscriptionAmount: Number(subMonthlySubscriptionAmount) || 0,
          planName: subPlanName
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully updated subscription/evaluation settings for ${data.center.name}!`);
        // Sync local view state
        setCenters(prev => prev.map(c => c.id === subCenterId ? data.center : c));
        setSubCenterId("");
      } else {
        alert("Failed to update subscription: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubUpdating(false);
    }
  };

  const handleCreateCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) return;

    const newC: Center = {
      id: `C00${centers.length + 1}`,
      name: cName,
      ownerName: cOwner,
      mobile: cMobile,
      email: cEmail,
      city: cCity,
      state: cState,
      country: "India",
      plan: cPlan,
      customPrice: (cPlan === "Custom Plan" || cPlan === "Custom") ? Number(cCustomPrice) || 0 : undefined,
      addresses: cAddresses.filter(addr => addr.trim() !== ""),
      subscriptionStart: new Date().toISOString().split("T")[0],
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "Active"
    };

    onAddCenter(newC);
    setCenters([...centers, newC]);
    setCName(""); setCOwner(""); setCEmail(""); setCMobile(""); setCCity(""); setCState("");
    setCCustomPrice(""); setCAddresses([""]);
    setShowAddCenter(false);
  };

  const handleOpenEditModal = (center: Center) => {
    setEditingCenter(center);
    setEditName(center.name);
    setEditOwner(center.ownerName);
    setEditEmail(center.email);
    setEditMobile(center.mobile);
    setEditPlan(center.plan);
    const isSuper = Boolean(center.isSuperCenter || center.planType === "Multi-Center / Super Center" || (center.centerLimit && center.centerLimit > 1));
    setEditPlanType(isSuper ? "Multi-Center / Super Center" : "Standard Center");
    setEditIsSuperCenter(isSuper);
    setEditStudentLimit(center.studentLimit !== undefined ? String(center.studentLimit) : "300");
    setEditTeacherLimit(center.teacherLimit !== undefined ? String(center.teacherLimit) : "20");
    setEditStaffLimit(center.staffLimit !== undefined ? String(center.staffLimit) : "10");
    setEditCenterLimit(center.centerLimit !== undefined ? String(center.centerLimit) : "5");
    setEditPassword(center.password || "password123");
    setEditCustomPrice(center.customPrice !== undefined ? String(center.customPrice) : "");
    setEditAddresses(center.addresses || [""]);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCenter) return;
    setEditSaving(true);
    try {
      const isSuper = editIsSuperCenter || editPlanType === "Multi-Center / Super Center";
      const res = await fetch("/api/erp/edit-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: editingCenter.id,
          name: editName,
          ownerName: editOwner,
          email: editEmail,
          mobile: editMobile,
          plan: editPlan,
          planType: editPlanType,
          isSuperCenter: isSuper,
          studentLimit: Number(editStudentLimit) || 10,
          teacherLimit: Number(editTeacherLimit) || 10,
          staffLimit: Number(editStaffLimit) || 5,
          centerLimit: Number(editCenterLimit) || 1,
          password: editPassword,
          status: editingCenter.status,
          customPrice: (editPlan === "Custom Plan" || editPlan === "Custom") ? Number(editCustomPrice) || 0 : undefined,
          addresses: editAddresses.filter(addr => addr.trim() !== "")
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Center tenant updated successfully!");
        setCenters(prev => prev.map(c => c.id === editingCenter.id ? {
          ...c,
          name: editName,
          ownerName: editOwner,
          email: editEmail,
          mobile: editMobile,
          plan: editPlan,
          planType: editPlanType,
          isSuperCenter: isSuper,
          studentLimit: Number(editStudentLimit) || 10,
          teacherLimit: Number(editTeacherLimit) || 10,
          staffLimit: Number(editStaffLimit) || 5,
          centerLimit: Number(editCenterLimit) || 1,
          password: editPassword,
          customPrice: (editPlan === "Custom Plan" || editPlan === "Custom") ? Number(editCustomPrice) || 0 : undefined,
          addresses: editAddresses.filter(addr => addr.trim() !== "")
        } : c));
        setEditingCenter(null);
      } else {
        alert(data.error || "Failed to edit center.");
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteCenter = async (centerId: string) => {
    if (!confirm("Are you absolutely sure you want to delete this Venture/Academy center? This action cannot be undone and will erase all data for this tenant.")) {
      return;
    }
    try {
      const res = await fetch("/api/erp/delete-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId })
      });
      const data = await res.json();
      if (data.success) {
        alert("Center tenant deleted successfully.");
        setCenters(prev => prev.filter(c => c.id !== centerId));
      } else {
        alert(data.error || "Failed to delete center.");
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred.");
    }
  };

  const handleCopyPassword = (center: Center) => {
    const passwordToShare = center.password || "password123";
    navigator.clipboard.writeText(passwordToShare);
    setCopiedCenterId(center.id);
    setTimeout(() => setCopiedCenterId(null), 2000);
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle) return;
    setAnnouncements([{ title: annTitle, text: annText, date: new Date().toISOString().split("T")[0] }, ...announcements]);
    setAnnTitle(""); setAnnText("");
    setShowAnnSuccess(true);
    setTimeout(() => setShowAnnSuccess(false), 3000);
  };

  const toggleCenterStatus = async (centerId: string) => {
    const center = centers.find(c => c.id === centerId);
    if (!center) return;
    const newStatus = center.status === "Active" ? "Inactive" : "Active";
    
    try {
      const res = await fetch("/api/erp/edit-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: centerId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setCenters(prev =>
          prev.map(c => c.id === centerId ? { ...c, status: newStatus } : c)
        );
      } else {
        alert("Failed to update status: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred while updating the status.");
    }
  };

  // SaaS Revenue Calculations
  // 10 Students: ₹9999, 20 Students: ₹18999, 40 Students: ₹26999, 100 Students: ₹49999, Custom Plan
  const getPlanPrice = (center: any) => {
    if ((center.plan === "Custom Plan" || center.plan === "Custom") && typeof center.customPrice === "number" && center.customPrice > 0) {
      return center.customPrice;
    }
    const foundPlan = plans.find(p => p.name === center.plan);
    if (foundPlan) return foundPlan.price;
    const plan = center.plan;
    if (plan === "10 Students Plan" || plan === "10 Students") return 9999;
    if (plan === "20 Students Plan" || plan === "20 Students") return 18999;
    if (plan === "40 Students Plan" || plan === "40 Students") return 26999;
    if (plan === "100 Students Plan" || plan === "100 Students") return 49999;
    if (plan === "Custom Plan" || plan === "Custom") return 99999;
    // Fallbacks
    if (plan === "Premium") return 75000;
    if (plan === "Standard") return 45000;
    return 20000;
  };

  const totalSaaSArr = centers.filter(c => c.status === "Active").reduce((acc, curr) => acc + getPlanPrice(curr), 0);

  // Website-wide Student Metrics
  const totalPortalStudents = students.length;
  
  // Top Academy (Center with most students)
  const getTopAcademyName = () => {
    if (!centers || centers.length === 0 || !students || students.length === 0) return "My Abacus Bangalore East";
    const counts: { [key: string]: number } = {};
    students.forEach(s => {
      counts[s.centerId] = (counts[s.centerId] || 0) + 1;
    });
    let maxCount = 0;
    let topCenterId = "";
    Object.keys(counts).forEach(cid => {
      if (counts[cid] > maxCount) {
        maxCount = counts[cid];
        topCenterId = cid;
      }
    });
    const topCenter = centers.find(c => c.id === topCenterId);
    return topCenter ? `${topCenter.name} (${maxCount} Students)` : "My Abacus Bangalore East";
  };
  const topAcademy = getTopAcademyName();

  // Top Result (Highest level achieved website-wide)
  const getTopResult = () => {
    if (!students || students.length === 0) return "Level 3 National Champion";
    const topLevelAchieved = Math.max(...students.map(s => s.currentLevel));
    const topStudentObj = students.find(s => s.currentLevel === topLevelAchieved);
    return `Level ${topLevelAchieved} Advanced Medalist (${topStudentObj?.studentName || "Ananya Pillai"})`;
  };
  const topResult = getTopResult();

  // Best Student (Student with highest currentLevel / or max accuracy/score)
  const getBestStudent = () => {
    if (!students || students.length === 0) return "Ananya Pillai (Bangalore East)";
    const topLevelAchieved = Math.max(...students.map(s => s.currentLevel));
    const topStudentObj = students.find(s => s.currentLevel === topLevelAchieved);
    if (!topStudentObj) return "Ananya Pillai (Bangalore East)";
    const centerObj = centers.find(c => c.id === topStudentObj.centerId);
    return `${topStudentObj.studentName} (Level ${topStudentObj.currentLevel} - ${centerObj ? centerObj.name : "Bangalore East"})`;
  };
  const bestStudent = getBestStudent();

  // Super Admin Analytics Calculations
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g., "2026-07"

  // Center Statistics
  const totalCenters = centers.length;
  const activeCentersCount = centers.filter(c => c.status === "Active").length;
  const newCentersThisMonth = centers.filter(c => c.subscriptionStart && c.subscriptionStart.startsWith(currentMonthStr)).length;

  // User Statistics
  const totalStudentsCount = students.length;
  const totalTeachersCount = teachers.length;
  
  // Deterministic Staff Count Helper
  const getStaffCount = (centerId: string, teacherCount: number) => {
    return Math.max(1, Math.ceil(teacherCount * 0.4)) + (centerId.charCodeAt(centerId.length - 1) % 2 === 0 ? 1 : 2);
  };
  const totalStaffMembers = centers.reduce((sum, c) => {
    const tCount = teachers.filter(t => t.centerId === c.id).length;
    return sum + getStaffCount(c.id, tCount);
  }, 0);

  // Lead Statistics
  const totalLeadsCount = leads.length;
  const newLeadsThisMonth = leads.filter(l => l.date && l.date.startsWith(currentMonthStr)).length;

  // Demo Bookings
  const totalDemoBookings = leads.filter(l => l.status === "Demo Booked" || l.status === "Demo Done").length;

  // Enrollments
  const totalEnrollmentsCount = leads.filter(l => l.status === "Enrolled").length;

  // Performance Statistics
  // 1. Best Teacher of the Month
  const getBestTeacher = () => {
    if (teachers.length === 0) return "No teachers registered";
    const teachersWithScore = teachers.map(t => {
      const tStudents = students.filter(s => s.teacherId === t.id);
      const tHomeworkCount = homework.filter(hw => hw.status === "Completed" && students.find(s => s.id === hw.studentId)?.teacherId === t.id).length;
      const score = (t.rating || 4.5) * 10 + tStudents.length * 2 + tHomeworkCount * 1.5;
      return { name: t.name, score };
    });
    teachersWithScore.sort((a, b) => b.score - a.score);
    return teachersWithScore[0]?.name || "N/A";
  };
  const bestTeacherOfMonth = getBestTeacher();

  // 2. Best Center of the Month
  const getBestCenter = () => {
    if (centers.length === 0) return "No centers registered";
    const centersWithScore = centers.map(c => {
      const cStudents = students.filter(s => s.centerId === c.id);
      const cLeads = leads.filter(l => l.centerId === c.id);
      const cFees = fees.filter(f => f.centerId === c.id && f.status === "Paid");
      const cRevenue = cFees.reduce((sum, f) => sum + f.amount, 0);
      const score = cRevenue * 0.1 + cStudents.length * 10 + cLeads.length * 2;
      return { name: c.name, score };
    });
    centersWithScore.sort((a, b) => b.score - a.score);
    return centersWithScore[0]?.name || "N/A";
  };
  const bestCenterOfMonth = getBestCenter();

  // 3. Highest Enrollment Center
  const getHighestEnrollmentCenter = () => {
    if (centers.length === 0) return "N/A";
    const counts = centers.map(c => ({
      name: c.name,
      count: students.filter(s => s.centerId === c.id).length
    }));
    counts.sort((a, b) => b.count - a.count);
    return counts[0] && counts[0].count > 0 ? `${counts[0].name} (${counts[0].count} Students)` : "N/A";
  };
  const highestEnrollmentCenter = getHighestEnrollmentCenter();

  // 4. Highest Revenue Center
  const getHighestRevenueCenter = () => {
    if (centers.length === 0) return "N/A";
    const revs = centers.map(c => {
      const centerFees = fees.filter(f => {
        if (f.centerId === c.id) return true;
        const s = students.find(std => std.id === f.studentId);
        return s?.centerId === c.id;
      });
      const revenue = centerFees.filter(f => f.status === "Paid").reduce((sum, f) => sum + f.amount, 0);
      return { name: c.name, revenue };
    });
    revs.sort((a, b) => b.revenue - a.revenue);
    return revs[0] && revs[0].revenue > 0 ? `${revs[0].name} (₹${revs[0].revenue.toLocaleString()})` : "N/A";
  };
  const highestRevenueCenter = getHighestRevenueCenter();

  // SaaS Subscription & ARR / MRR Metrics
  const todayStr = new Date().toISOString().split("T")[0];
  const saasRevenue = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);
  const activeSaaSCenters = centers.filter(c => c.status === "Active" || c.subscriptionStatus === "Active").length;
  
  const getDaysToRenewal = (renewalDateStr?: string) => {
    if (!renewalDateStr) return 999;
    const diffTime = new Date(renewalDateStr).getTime() - new Date(todayStr).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const expiringSaaSCenters = centers.filter(c => {
    const days = getDaysToRenewal(c.nextRenewalDate);
    return days >= 0 && days <= 30 && c.status === "Active";
  }).length;
  
  const overdueSaaSCenters = centers.filter(c => {
    const isPast = c.nextRenewalDate && c.nextRenewalDate < todayStr;
    return c.status === "Expired" || c.status === "Suspended" || c.subscriptionStatus === "Expired" || c.subscriptionStatus === "Suspended" || isPast;
  }).length;
  
  const calculatedMRR = centers.filter(c => c.status === "Active").reduce((sum, c) => sum + (c.monthlySubscriptionAmount || 999), 0);

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-xl text-center space-y-6 animate-fade-in" id="superadmin-login-card">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-950 font-display">Abacus Academy Super Admin</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Authorized access only. Log in to manage Venture/Academy center contracts, allocate evaluation trials, and monitor ARR metrics.
          </p>
        </div>

        {adminError && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] font-bold text-rose-600">
            {adminError}
          </div>
        )}

        <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Email ID</label>
            <input
              type="email"
              required
              placeholder="admin@geniplus.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-indigo-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-indigo-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <button
            type="submit"
            disabled={adminLoading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            {adminLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> : <Key className="w-3.5 h-3.5 text-white" />}
            <span>Unlock Superadmin Panel</span>
          </button>
        </form>

        <div className="border-t border-slate-100 pt-5 text-left text-xs bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="font-bold text-slate-700 mb-1">Testing Credentials:</div>
          <div className="text-[11px] text-slate-500 font-mono flex flex-col gap-1">
            <span>Email: <strong className="text-slate-700">admin@geniplus.com</strong></span>
            <span>Password: <strong className="text-slate-700">password123</strong></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="super-admin-view">

      {/* Super Admin Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="bg-rose-950 text-rose-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-rose-900/40">
            System Overseer Account
          </span>
          <h2 className="text-xl md:text-2xl font-black font-display mt-2">
            Superadmin Console ⚡
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            AOS Platform Analytics • Global Multi-tenant Subscriptions • Broadcast Service
          </p>
        </div>
        <button
          onClick={handleAdminLogout}
          className="bg-slate-800 hover:bg-rose-700 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Lock Admin Dashboard</span>
        </button>
      </div>
      
      {/* SaaS Subscriptions & Billing Metrics Dashboard */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4" id="saas-subscriptions-billing-metrics">
        <div>
          <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2 font-display">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Global Platform Subscriptions & ARR/MRR Metrics
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Real-time status of commercial recurring revenues, paid SaaS amounts, active tenant centers, upcoming renewals, and delinquent/overdue contracts.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-indigo-950 border border-indigo-900 rounded-2xl p-4.5 text-white shadow-md">
            <div className="text-[9px] font-black text-indigo-300 uppercase tracking-wider">Monthly Recurring Revenue (MRR)</div>
            <div className="text-xl font-black mt-1 font-mono">₹{calculatedMRR.toLocaleString('en-IN')}</div>
            <p className="text-[9px] text-indigo-300 mt-1">Sum of active commercial licenses.</p>
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
            <div className="text-[9px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Paid SaaS Revenue
            </div>
            <div className="text-xl font-black text-emerald-600 mt-1 font-mono">₹{saasRevenue.toLocaleString('en-IN')}</div>
            <p className="text-[9px] text-emerald-500 mt-1">Total subscription receipts collected.</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Active Centers</div>
            <div className="text-xl font-black text-indigo-900 mt-1 font-mono">{activeSaaSCenters} Centers</div>
            <p className="text-[9px] text-slate-400 mt-1">Venture centers with active status.</p>
          </div>

          <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-xs">
            <div className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Expiring (30d)</div>
            <div className="text-xl font-black text-amber-600 mt-1 font-mono">{expiringSaaSCenters} Centers</div>
            <p className="text-[9px] text-amber-500 mt-1">Renewals within next 30 days.</p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[9px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
              Overdue / Delinquent
            </div>
            <div className="text-xl font-black text-rose-700 mt-1 font-mono">{overdueSaaSCenters} Centers</div>
            <p className="text-[9px] text-rose-700 font-semibold mt-1">Expired or suspended centers.</p>
          </div>
        </div>
      </div>

      {/* Website Student Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Active Students</div>
          <div className="text-2xl md:text-3xl font-black text-indigo-600 mt-1 font-display leading-tight">{totalPortalStudents} Students</div>
          <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
            <Users className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>Enrolled across divisions</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top Academy Center</div>
          <div className="text-sm font-black text-slate-800 mt-2 font-display leading-tight line-clamp-2">{topAcademy}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Highest student count</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top Result achieved</div>
          <div className="text-sm font-bold text-emerald-700 mt-2 font-display leading-tight line-clamp-2">{topResult}</div>
          <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
            <Trophy className="w-3 h-3 shrink-0" />
            <span>Advanced levels</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Best Student (Website)</div>
          <div className="text-sm font-black text-indigo-950 mt-2 font-display leading-tight line-clamp-2">{bestStudent}</div>
          <div className="text-[10px] text-indigo-500 mt-1 flex items-center gap-1 font-bold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            <span>Top accuracy performer</span>
          </div>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        {[
          { id: "analytics" as const, label: "Analytics Dashboard", icon: TrendingUp },
          { id: "centers" as const, label: "Franchise Centers", icon: Building2 },
          { id: "teachers" as const, label: "Teacher Multi-Assignments", icon: Users },
          { id: "plans" as const, label: "AOS Plans Creator", icon: Sparkles },
          { id: "payments" as const, label: "AOS Bills & Reminders", icon: DollarSign },
          { id: "accounting" as const, label: "Global Accounting", icon: Calculator },
          { id: "inventory" as const, label: "Material & Store", icon: Package },
          { id: "teacher_training" as const, label: "Teacher Training & LMS Academy", icon: GraduationCap },
          { id: "landing_cms" as const, label: "Landing Page CMS", icon: Globe },
          { id: "logs" as const, label: "AOS Activity Logs", icon: ClipboardList },
          { id: "diagnostics" as const, label: "System Diagnostics & Telemetry", icon: Activity }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-indigo-600 text-indigo-900 bg-indigo-50/40 rounded-t-2xl"
                  : "border-transparent text-slate-500 hover:text-indigo-600 hover:border-slate-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "analytics" && (
        <div className="space-y-6 animate-fade-in font-sans" id="analytics-tab-view">
          {/* Dashboard Header */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
            <h3 className="text-lg font-black text-indigo-900 font-display flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Academy Operations & Growth Index (System-Wide)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated real-time multi-tenant aggregate indices, lead performance metrics, and center enrollment tracking.
            </p>
          </div>

          {/* Bento Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Center Statistics Card */}
            <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Center Statistics</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-black text-indigo-950 font-display">{totalCenters}</div>
                <div className="text-xs text-slate-600 font-medium space-y-1">
                  <div className="flex justify-between">
                    <span>Active Centers:</span>
                    <span className="font-bold text-emerald-600">{activeCentersCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New This Month:</span>
                    <span className="font-bold text-indigo-600">+{newCentersThisMonth}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Statistics Card */}
            <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">User Statistics</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-black text-emerald-950 font-display">{totalStudentsCount}</div>
                <div className="text-xs text-slate-600 font-medium space-y-1">
                  <div className="flex justify-between">
                    <span>Total Teachers:</span>
                    <span className="font-bold text-indigo-600">{totalTeachersCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Staff Members:</span>
                    <span className="font-bold text-indigo-600">{totalStaffMembers}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lead & Acquisition Statistics Card */}
            <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lead Statistics</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-2xl">
                  <Megaphone className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-black text-rose-950 font-display">{totalLeadsCount}</div>
                <div className="text-xs text-slate-600 font-medium space-y-1">
                  <div className="flex justify-between">
                    <span>New Leads (Month):</span>
                    <span className="font-bold text-rose-600">+{newLeadsThisMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Demo Booked:</span>
                    <span className="font-bold text-amber-600">{totalDemoBookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Converted Enrollments:</span>
                    <span className="font-bold text-emerald-600">{totalEnrollmentsCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Statistics Card */}
            <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Performance Statistics</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Best Teacher of the Month</span>
                  <span className="font-black text-slate-900 line-clamp-1">⭐ {bestTeacherOfMonth}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Best Center of the Month</span>
                  <span className="font-black text-slate-900 line-clamp-1">👑 {bestCenterOfMonth}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Highest Enrollment Center</span>
                  <span className="font-black text-indigo-950 line-clamp-1">{highestEnrollmentCenter}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Highest Revenue Center</span>
                  <span className="font-black text-emerald-700 line-clamp-1">{highestRevenueCenter}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Account Statistics Grid */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-black text-indigo-950 uppercase tracking-wider">
                  Franchise Center Account Statistics
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparative performance and license renewal indices for each registered location.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[9px] tracking-wider border-b border-slate-100">
                    <th className="p-3.5">Center ID / Name</th>
                    <th className="p-3.5">Plan Name</th>
                    <th className="p-3.5 text-center">Student Limit</th>
                    <th className="p-3.5 text-center">Active Students</th>
                    <th className="p-3.5 text-center">Remaining Capacity</th>
                    <th className="p-3.5">Subscription Expiry Date</th>
                    <th className="p-3.5 text-center">Teachers</th>
                    <th className="p-3.5 text-center">Staff Members</th>
                    <th className="p-3.5 text-center">CRM Leads</th>
                    <th className="p-3.5">Renewal / Contract Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {centers.map(center => {
                    const cTeachers = teachers.filter(t => t.centerId === center.id).length;
                    const cStudents = students.filter(s => s.centerId === center.id).length;
                    const activeStudents = students.filter(s => s.centerId === center.id && s.status === "Active").length;
                    const cStaff = getStaffCount(center.id, cTeachers);
                    const cLeads = leads.filter(l => l.centerId === center.id).length;

                    const studentLimit = center.studentLimit !== undefined ? Number(center.studentLimit) : (center.planType === "Custom" ? 25 : 10);
                    const remainingCap = Math.max(0, studentLimit - activeStudents);

                    // Expiry check
                    const expiryDate = center.subscriptionExpiry ? new Date(center.subscriptionExpiry) : null;
                    const todayDate = new Date();
                    let renewalLabel = "Active ✓";
                    let badgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";

                    if (expiryDate) {
                      const diffTime = expiryDate.getTime() - todayDate.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (diffDays < 0) {
                        renewalLabel = "Expired 🚨";
                        badgeClass = "bg-rose-50 text-rose-700 border border-rose-100";
                      } else if (diffDays <= 30) {
                        renewalLabel = `Renew Contract ⚠️ (${diffDays} days left)`;
                        badgeClass = "bg-amber-50 text-amber-700 border border-amber-100";
                      } else {
                        renewalLabel = `Active ✓`;
                        badgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                      }
                    }

                    return (
                      <tr key={center.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-3.5">
                          <div className="font-extrabold text-indigo-950">{center.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex gap-1.5 items-center">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded font-semibold text-slate-500">{center.id}</span>
                            <span>•</span>
                            <span>{center.city}, {center.state}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full text-[10px]">
                            {center.plan}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-slate-900 font-mono">{studentLimit}</td>
                        <td className="p-3.5 text-center font-extrabold text-slate-900 font-mono">{activeStudents}</td>
                        <td className={`p-3.5 text-center font-extrabold font-mono ${remainingCap === 0 ? "text-rose-600" : remainingCap <= 5 ? "text-amber-600" : "text-emerald-600"}`}>{remainingCap}</td>
                        <td className="p-3.5 font-bold text-slate-600 font-mono">{center.subscriptionExpiry || "N/A"}</td>
                        <td className="p-3.5 text-center font-bold text-slate-900">{cTeachers}</td>
                        <td className="p-3.5 text-center font-bold text-slate-900">{cStaff}</td>
                        <td className="p-3.5 text-center font-bold text-slate-900">{cLeads}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                            {renewalLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "centers" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="centers-tab-view">
          
          {/* Centers registry list (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Licensed Abacus Academy SaaS Centers
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Register new Venture/Academy centers and manage subscription plans.</p>
              </div>
              <button
                onClick={() => setShowAddCenter(!showAddCenter)}
                className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-xl text-indigo-700 text-xs font-semibold transition-all active:scale-95"
                id="add-center-btn"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Register Center</span>
              </button>
            </div>

            {showAddCenter && (
              <form onSubmit={handleCreateCenter} className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-4 mb-6">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Register New Academy Tenant</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Center Name</label>
                    <input type="text" required value={cName} onChange={(e) => setCName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Owner Name</label>
                    <input type="text" required value={cOwner} onChange={(e) => setCOwner(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Owner Email</label>
                    <input type="email" required value={cEmail} onChange={(e) => setCEmail(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Owner Mobile</label>
                    <input type="text" required value={cMobile} onChange={(e) => setCMobile(e.target.value)} placeholder="+91" className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Subscription Plan</label>
                    <select value={cPlan} onChange={(e) => setCPlan(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium">
                      {plans.filter(p => p.status === "Active").map(p => (
                        <option key={p.id} value={p.name}>{p.name} (₹{p.price.toLocaleString('en-IN')}/{p.billingCycle === "Monthly" ? "mo" : "yr"})</option>
                      ))}
                      <option value="Custom Plan">Custom Plan (Per Requirements)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">City</label>
                    <input type="text" value={cCity} onChange={(e) => setCCity(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">State</label>
                    <input type="text" value={cState} onChange={(e) => setCState(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium" />
                  </div>
                </div>

                {/* Optional Custom Plan Amount manual input */}
                {(cPlan === "Custom Plan" || cPlan === "Custom") && (
                  <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-[11px] font-extrabold text-indigo-900 mb-1 uppercase tracking-wider">Custom Plan Amount (INR/year)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 150000"
                        value={cCustomPrice}
                        onChange={(e) => setCCustomPrice(e.target.value)}
                        className="w-full max-w-xs bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-950 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="text-xs text-indigo-700 font-medium">
                      ✨ <strong>Unlimited Plan</strong>: Centers registered with the Custom Plan can enroll an unlimited number of students and teachers without restriction.
                    </div>
                  </div>
                )}

                {/* Multiple Center Addresses Option */}
                <div className="bg-white border border-gray-150 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Multiple Address Locations / Branches</div>
                    <button
                      type="button"
                      onClick={() => setCAddresses([...cAddresses, ""])}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      + Add Branch Address
                    </button>
                  </div>
                  <div className="space-y-2">
                    {cAddresses.map((addr, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] text-slate-400 font-mono w-6">#{idx+1}</span>
                        <input
                          type="text"
                          placeholder="e.g. Ground Floor, East Wing, Bangalore"
                          value={addr}
                          onChange={(e) => {
                            const updated = [...cAddresses];
                            updated[idx] = e.target.value;
                            setCAddresses(updated);
                          }}
                          className="flex-1 bg-gray-50/50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:bg-white"
                        />
                        {cAddresses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCAddresses(cAddresses.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 text-xs font-bold px-1"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddCenter(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">Register Tenant</button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {centers.map(center => (
                <div key={center.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">{center.id}</span>
                      <span className="font-bold text-gray-900 text-sm font-display">{center.name}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                        center.plan === "100 Students Plan" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                        center.plan === "40 Students Plan" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        center.plan === "20 Students Plan" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        center.plan === "10 Students Plan" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {center.plan}
                      </span>
                      {center.isTrial && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Evaluating Free Trial ({center.trialDays} Days)</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Owner: <strong className="text-gray-700 font-semibold">{center.ownerName}</strong> ({center.mobile})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-indigo-600">{center.email}</span>
                      </div>
                      {center.isTrial && center.trialExpiryDate ? (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-md border border-emerald-100 w-fit">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Trial Evaluation Ends: <strong className="font-mono text-xs">{center.trialExpiryDate}</strong></span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>License Expires: <strong className="text-gray-600 font-mono">{center.subscriptionExpiry}</strong></span>
                        </div>
                      )}

                      {(center.plan === "Custom Plan" || center.plan === "Custom") && typeof center.customPrice === "number" && (
                        <div className="flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-150 w-fit">
                          <span>Custom Fee: ₹{center.customPrice.toLocaleString('en-IN')}/year</span>
                          <span className="text-[9px] font-normal text-slate-500">(Unlimited Students & Teachers)</span>
                        </div>
                      )}

                      {center.addresses && center.addresses.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-150 space-y-1">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Addresses & Branches:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {center.addresses.map((addr, idx) => (
                              <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded-md font-medium flex items-center gap-1 shadow-2xs">
                                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                                {addr}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Share password action */}
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(center)}
                      title="Copy Secret Password to Share"
                      className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                    >
                      {copiedCenterId === center.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="w-3.5 h-3.5" />
                          <span>Share Pass</span>
                        </>
                      )}
                    </button>

                    {/* Edit details */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(center)}
                      title="Edit Franchise Center Details"
                      className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Tenant */}
                    <button
                      type="button"
                      onClick={() => handleDeleteCenter(center.id)}
                      title="Delete Franchise Center Tenant"
                      className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    {/* Status Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleCenterStatus(center.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                        center.status === "Active"
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                      }`}
                      id={`center-toggle-${center.id}`}
                    >
                      {center.status}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Franchise Subscription & Free Trial Administrator Desk */}
            <form onSubmit={handleUpdateSubscriptionSubmit} className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2 font-display">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                  Subscription & Evaluation Trials Desk
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Manage subscription terms or allocate timed evaluation free trials to centers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Select Center</label>
                  <select
                    required
                    value={subCenterId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setSubCenterId(cid);
                      const found = centers.find(c => c.id === cid);
                      if (found) {
                        setSubPlan(found.plan || "Standard");
                        setSubPlanName(found.planName || found.plan || "Starter Plan");
                        setSubExpiry(found.subscriptionExpiry);
                        setSubIsTrial(!!found.isTrial);
                        setSubTrialDays(found.trialDays || 30);
                        setSubPlanType((found.planType === "Custom" || found.plan?.includes("Custom Plan") || found.plan === "Custom") ? "Custom" : "Predefined");
                        setSubCustomStudentLimit(found.studentLimit !== undefined ? String(found.studentLimit) : "25");
                        setSubCustomMonthlyPrice(found.monthlyPrice !== undefined ? String(found.monthlyPrice) : "1299");
                        setSubBillingDate(found.billingDate || 5);
                        setSubNextRenewalDate(found.nextRenewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
                        setSubSubscriptionStatus(found.subscriptionStatus || "Active");
                        setSubMonthlySubscriptionAmount(found.monthlySubscriptionAmount !== undefined ? String(found.monthlySubscriptionAmount) : "999");
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose Center Head --</option>
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.plan} Plan)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Plan Type</label>
                  <div className="flex gap-4 py-2.5">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                      <input
                        type="radio"
                        name="subPlanType"
                        value="Predefined"
                        checked={subPlanType === "Predefined"}
                        onChange={() => setSubPlanType("Predefined")}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Predefined Plan</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                      <input
                        type="radio"
                        name="subPlanType"
                        value="Custom"
                        checked={subPlanType === "Custom"}
                        onChange={() => setSubPlanType("Custom")}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Custom Plan</span>
                    </label>
                  </div>
                </div>

                {subPlanType === "Predefined" ? (
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Subscription Plan Level</label>
                    <select
                      value={subPlan}
                      onChange={(e) => setSubPlan(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {plans.filter(p => p.status === "Active").map(p => (
                        <option key={p.id} value={p.name}>{p.name} (₹{p.price.toLocaleString('en-IN')}/{p.billingCycle === "Monthly" ? "mo" : "yr"})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <div>
                      <label className="block font-bold text-indigo-900 mb-1">Maximum Student Limit</label>
                      <input
                        type="number"
                        required
                        value={subCustomStudentLimit}
                        onChange={(e) => setSubCustomStudentLimit(e.target.value)}
                        placeholder="e.g. 25"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Presets: 5, 10, 15, 20, 25, 35, 50, 75, 100, etc.</p>
                    </div>
                    <div>
                      <label className="block font-bold text-indigo-900 mb-1">Monthly Price (INR)</label>
                      <input
                        type="number"
                        required
                        value={subCustomMonthlyPrice}
                        onChange={(e) => setSubCustomMonthlyPrice(e.target.value)}
                        placeholder="e.g. 1299"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-150 rounded-xl p-3.5 space-y-3.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-evaluation-trial"
                    checked={subIsTrial}
                    onChange={(e) => setSubIsTrial(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="is-evaluation-trial" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Activate Evaluation Free Trial for this center
                  </label>
                </div>

                {subIsTrial ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-fade-in">
                    <div>
                      <label className="block font-bold text-emerald-800 mb-1">Trial Evaluation Period (Days)</label>
                      <select
                        value={subTrialDays}
                        onChange={(e) => setSubTrialDays(Number(e.target.value))}
                        className="w-full bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-2.5 font-bold outline-none"
                      >
                        <option value={7}>7 Days Fast Evaluation</option>
                        <option value={14}>14 Days Regular Trial</option>
                        <option value={30}>30 Days Comprehensive Trial</option>
                        <option value={60}>60 Days Extensive Evaluation</option>
                      </select>
                    </div>
                    <div className="flex items-center text-[11px] text-emerald-700 leading-relaxed font-semibold">
                      * The center will automatically enter "Active Trial" status. On expiration, the local admin will be prompted to select one of the commercial plans.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        {subPlanType === "Custom" ? "Renewal Date" : "Contract License Expiry Date"}
                      </label>
                      <input
                        type="date"
                        value={subExpiry}
                        onChange={(e) => setSubExpiry(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Center Automated Recurring Billing Schedule Configuration */}
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4.5 space-y-3" id="center-automated-billing-setup">
                <div className="text-[10px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  Center Automated Recurring Billing Schedule Setup
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Plan Name</label>
                    <input
                      type="text"
                      required
                      value={subPlanName}
                      onChange={(e) => setSubPlanName(e.target.value)}
                      placeholder="e.g. Growth Plan"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Monthly Subscription Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={subMonthlySubscriptionAmount}
                      onChange={(e) => setSubMonthlySubscriptionAmount(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 focus:ring-1 focus:ring-indigo-500 outline-none"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Billing Date (Day of Month 1-31)</label>
                    <input
                      type="number"
                      required
                      value={subBillingDate}
                      onChange={(e) => setSubBillingDate(Number(e.target.value))}
                      placeholder="e.g. 5"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 focus:ring-1 focus:ring-indigo-500 outline-none"
                      min="1"
                      max="31"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Next Renewal Date</label>
                    <input
                      type="date"
                      required
                      value={subNextRenewalDate}
                      onChange={(e) => setSubNextRenewalDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-indigo-950 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1 text-xs">Subscription Status</label>
                  <select
                    value={subSubscriptionStatus}
                    onChange={(e) => setSubSubscriptionStatus(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl p-2 font-bold text-xs text-indigo-950 outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={subUpdating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  {subUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Save Subscription & Evaluation Terms</span>
                </button>
              </div>
            </form>
          </div>

          {/* System Announcements (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
              <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-1">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                Super Admin Announcements
              </h3>
              <p className="text-xs text-slate-500 mb-4">Send system announcements, curriculum adjustments, or billing notices across all tenant centers.</p>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Announcement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Server Maintenance or Syllabus Update"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                    id="ann-title-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Content Body</label>
                  <textarea
                    required
                    value={annText}
                    onChange={(e) => setAnnText(e.target.value)}
                    placeholder="Describe the instructions in detail..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium h-24 focus:ring-1 focus:ring-indigo-500"
                    id="ann-text-textarea"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]"
                  id="publish-ann-btn"
                >
                  Broadcast Announcement
                </button>
              </form>

              {showAnnSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg p-2.5 mt-3 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Broadcast complete! Senders will receive notification in App.</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-900 font-display mb-3">Live Broadcast Log</div>
              <div className="space-y-3 max-h-[160px] overflow-y-auto">
                {announcements.map((ann, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-700">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>{ann.title}</span>
                      <span className="font-mono text-[9px] text-slate-400">{ann.date}</span>
                    </div>
                    <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">{ann.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === "teachers" && (
        <div className="space-y-6 animate-fade-in font-sans" id="teachers-tab-view">
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-indigo-950 font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Teacher & Staff Multi-Center Assignments
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Assign teachers, trainers, or self-teaching center owners to multiple franchise branches (e.g. Tarsali Main & Manjalpur Sub-Center).
              </p>
            </div>
            <button
              onClick={() => {
                setNewTeacherName("");
                setNewTeacherEmail("");
                setNewTeacherMobile("");
                setNewTeacherRole("Senior Abacus Trainer");
                setNewTeacherCenterIds(centers.length > 0 ? [centers[0].id] : ["C001"]);
                setShowAddTeacherModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register New Multi-Center Teacher</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[9px] tracking-wider border-b border-slate-100">
                    <th className="p-3.5">Teacher / Personnel</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Primary Center</th>
                    <th className="p-3.5">Assigned Multi-Centers</th>
                    <th className="p-3.5 text-center">Assigned Students</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {teachers.map(t => {
                    const primaryCenter = centers.find(c => c.id === t.centerId);
                    const assignedCenterObjects = centers.filter(c => 
                      (t.centerIds && t.centerIds.includes(c.id)) || c.id === t.centerId
                    );
                    const studentCount = students.filter(s => s.teacherId === t.id || assignedCenterObjects.some(c => c.id === s.centerId)).length;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-3.5">
                          <div className="font-black text-slate-900 text-xs">{t.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{t.email} • {t.mobile || "No Mobile"}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full text-[10px] border border-indigo-100">
                            {t.role || "Trainer"}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">
                          {primaryCenter ? `${primaryCenter.name} (${primaryCenter.id})` : t.centerId}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {assignedCenterObjects.map(c => (
                              <span key={c.id} className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-emerald-100">
                                📍 {c.name} ({c.id})
                              </span>
                            ))}
                            {assignedCenterObjects.length === 0 && (
                              <span className="text-slate-400 italic text-[10px]">Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-slate-900 font-mono">{studentCount}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setEditingTeacher(t);
                              const existingIds = t.centerIds && t.centerIds.length > 0 ? t.centerIds : [t.centerId];
                              setEditTeacherCenterIds(existingIds);
                            }}
                            className="bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                            <span>Edit Centers</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        No teachers registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Teacher Multi-Center Assignment Modal */}
          {editingTeacher && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-base font-black text-slate-900 font-display">Assign Centers to {editingTeacher.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Select all franchise centers and sub-branches this teacher or owner can manage and teach at.</p>
                  </div>
                  <button
                    onClick={() => setEditingTeacher(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-950">
                    Select Franchise Branches ({editTeacherCenterIds.length} Selected):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
                    {centers.map(c => {
                      const isChecked = editTeacherCenterIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                            isChecked
                              ? "bg-indigo-50 border-indigo-200 text-indigo-950 shadow-2xs"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditTeacherCenterIds(prev => [...prev, c.id]);
                              } else {
                                setEditTeacherCenterIds(prev => prev.filter(id => id !== c.id));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <div>
                            <div className="font-extrabold">{c.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{c.id} {c.parentCenterId ? '• Sub-Branch' : '• Main Center'}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setEditingTeacher(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (editTeacherCenterIds.length === 0) {
                        alert("Please select at least one center.");
                        return;
                      }
                      try {
                        const response = await fetch("/api/erp/update-teacher", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: editingTeacher.id,
                            centerId: editTeacherCenterIds[0],
                            centerIds: editTeacherCenterIds
                          })
                        });
                        const resData = await response.json();
                        if (resData.success) {
                          alert(`Updated multi-center assignments for ${editingTeacher.name}!`);
                          setEditingTeacher(null);
                          if (onRefreshData) onRefreshData();
                        } else {
                          alert(resData.error || "Failed to update teacher centers.");
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Error updating teacher multi-centers.");
                      }
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    Save Multi-Center Assignments
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add New Teacher Modal */}
          {showAddTeacherModal && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-base font-black text-slate-900 font-display">Register Multi-Center Teacher</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Add a new trainer and assign them to one or multiple centers.</p>
                  </div>
                  <button onClick={() => setShowAddTeacherModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email ID</label>
                      <input
                        type="email"
                        value={newTeacherEmail}
                        onChange={(e) => setNewTeacherEmail(e.target.value)}
                        placeholder="rahul@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                      <input
                        type="text"
                        value={newTeacherMobile}
                        onChange={(e) => setNewTeacherMobile(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                    <select
                      value={newTeacherRole}
                      onChange={(e) => setNewTeacherRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      <option value="Senior Abacus Trainer">Senior Abacus Trainer</option>
                      <option value="Junior Teacher">Junior Teacher</option>
                      <option value="Center Owner & Trainer">Center Owner & Trainer</option>
                      <option value="Assistant Manager">Assistant Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-indigo-950 mb-1.5">Assign Centers:</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50">
                      {centers.map(c => {
                        const isChecked = newTeacherCenterIds.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewTeacherCenterIds(prev => [...prev, c.id]);
                                } else {
                                  setNewTeacherCenterIds(prev => prev.filter(id => id !== c.id));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{c.name} ({c.id})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => setShowAddTeacherModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">Cancel</button>
                  <button
                    onClick={async () => {
                      if (!newTeacherName || !newTeacherEmail) {
                        alert("Please provide teacher name and email.");
                        return;
                      }
                      if (newTeacherCenterIds.length === 0) {
                        alert("Please select at least one center.");
                        return;
                      }
                      try {
                        const response = await fetch("/api/erp/add-teacher", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: newTeacherName,
                            email: newTeacherEmail,
                            mobile: newTeacherMobile,
                            role: newTeacherRole,
                            centerId: newTeacherCenterIds[0],
                            centerIds: newTeacherCenterIds,
                            status: "Active"
                          })
                        });
                        const resData = await response.json();
                        if (resData.success) {
                          alert(`Registered ${newTeacherName} with multi-center access!`);
                          setShowAddTeacherModal(false);
                          if (onRefreshData) onRefreshData();
                        } else {
                          alert(resData.error || "Failed to register teacher.");
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Error registering multi-center teacher.");
                      }
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer"
                  >
                    Register Teacher
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "plans" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="plans-tab-view">
          {/* Left panel: Add new plan form */}
          <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm h-fit">
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-1">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              Create Subscription Plan
            </h3>
            <p className="text-xs text-slate-500 mb-4">Add a new dynamic AOS subscription tier for single centers or multi-center chains.</p>

            {planSuccessMsg && (
              <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl p-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{planSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newPlanName || !newPlanPrice) {
                alert("Please fill in the Plan Name and Price.");
                return;
              }
              const isMulti = newPlanType === "Multi-Center / Super Center";
              const newPlan: SubscriptionPlan = {
                id: "plan_" + Date.now(),
                name: newPlanName,
                planType: newPlanType,
                maxStudents: newPlanMaxStudents === "Unlimited" ? "Unlimited" : Number(newPlanMaxStudents) || 300,
                maxTeachers: isMulti ? (newPlanMaxTeachers === "Unlimited" ? "Unlimited" : Number(newPlanMaxTeachers) || 20) : undefined,
                maxStaff: isMulti ? (newPlanMaxStaff === "Unlimited" ? "Unlimited" : Number(newPlanMaxStaff) || 10) : undefined,
                maxCenters: isMulti ? (newPlanMaxCenters === "Unlimited" ? "Unlimited" : Number(newPlanMaxCenters) || 5) : 1,
                price: Number(newPlanPrice) || 0,
                features: newPlanFeatures.split(",").map(f => f.trim()).filter(f => f !== ""),
                status: "Active",
                billingCycle: newPlanBillingCycle
              };

              const updatedPlans = [...plans, newPlan];
              setPlans(updatedPlans);
              try {
                await fetch("/api/erp/saas-plans", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ plans: updatedPlans })
                });
              } catch (err) {
                console.error("Failed to save plan to backend:", err);
              }

              setNewPlanName("");
              setNewPlanPrice("");
              setNewPlanFeatures("");
              setPlanSuccessMsg(`Plan "${newPlan.name}" created successfully!`);
              setTimeout(() => setPlanSuccessMsg(""), 3000);
            }} className="space-y-4 text-xs">

              <div>
                <label className="block font-bold text-slate-600 mb-1">Plan Category / Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPlanType("Standard Center")}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${newPlanType === "Standard Center" ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                  >
                    🏢 Standard Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPlanType("Multi-Center / Super Center")}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${newPlanType === "Multi-Center / Super Center" ? "bg-amber-500 border-amber-500 text-white shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                  >
                    👑 Multi-Center / Super Center
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Plan Display Name</label>
                <input
                  type="text"
                  required
                  placeholder={newPlanType === "Multi-Center / Super Center" ? "e.g. Academy Pro Multi-Center" : "e.g. Starter Growth"}
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1 font-display">Billing Cycle</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPlanBillingCycle("Annually")}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${newPlanBillingCycle === "Annually" ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                  >
                    Annually
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPlanBillingCycle("Monthly")}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${newPlanBillingCycle === "Monthly" ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Limits Configuration */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-3">
                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  {newPlanType === "Multi-Center / Super Center" ? "Shared Super Center Account Limits" : "Single Center Account Limits"}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">Active Student Limit</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 300"
                      value={newPlanMaxStudents}
                      onChange={(e) => setNewPlanMaxStudents(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {newPlanType === "Multi-Center / Super Center" ? (
                    <div>
                      <label className="block font-bold text-slate-600 mb-1 text-[11px]">Teacher Limit</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 20"
                        value={newPlanMaxTeachers}
                        onChange={(e) => setNewPlanMaxTeachers(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold text-slate-600 mb-1 text-[11px]">Plan Price (INR)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 15000"
                        value={newPlanPrice}
                        onChange={(e) => setNewPlanPrice(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  )}
                </div>

                {newPlanType === "Multi-Center / Super Center" && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1 text-[11px]">Staff / User Limit</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 10"
                        value={newPlanMaxStaff}
                        onChange={(e) => setNewPlanMaxStaff(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1 text-[11px]">Sub-Center Limit</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 5"
                        value={newPlanMaxCenters}
                        onChange={(e) => setNewPlanMaxCenters(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {newPlanType === "Multi-Center / Super Center" && (
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                      {newPlanBillingCycle === "Monthly" ? "Monthly" : "Annual"} Price (INR)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 59999"
                      value={newPlanPrice}
                      onChange={(e) => setNewPlanPrice(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Features list (comma-separated)</label>
                <textarea
                  placeholder="Shared 300 Students, Shared 20 Teachers, 5 Sub-Centers, Master Dashboard"
                  value={newPlanFeatures}
                  onChange={(e) => setNewPlanFeatures(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 outline-none h-20 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish New Plan Tier</span>
              </button>
            </form>
          </div>

          {/* Right panel: Active plans directory */}
          <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  AOS Subscription Catalog
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage existing commercial tiers and status toggling.</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
                {(["All", "Annually", "Monthly"] as const).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setCatalogCycleFilter(cycle)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${catalogCycleFilter === cycle ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    {cycle}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans
                .filter(p => catalogCycleFilter === "All" || p.billingCycle === catalogCycleFilter || (!p.billingCycle && catalogCycleFilter === "Annually"))
                .map((p) => {
                  const isActive = p.status === "Active";
                  const isMulti = p.planType === "Multi-Center / Super Center" || (p.maxCenters && Number(p.maxCenters) > 1);
                  return (
                    <div key={p.id} className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${isActive ? "bg-slate-50/50 border-slate-200" : "bg-slate-50 border-slate-150 opacity-60"}`}>
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border mb-1 inline-block ${isMulti ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                              {isMulti ? "👑 Multi-Center" : "🏢 Standard"}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900">{p.name}</h4>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-black text-slate-900 font-mono">₹{p.price.toLocaleString('en-IN')}</div>
                            <div className="text-[9px] text-slate-400 font-semibold">{p.billingCycle === "Monthly" ? "per month" : "per annum"}</div>
                          </div>
                        </div>

                        {/* Shared Limit badges summary */}
                        <div className="mt-3 bg-white p-2 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-700 space-y-1">
                          <div className="text-[9px] font-extrabold text-indigo-900 uppercase tracking-wider">Shared Account Limits</div>
                          <div className="flex flex-wrap gap-x-2 gap-y-1">
                            <span>🎓 Students: <strong>{p.maxStudents}</strong></span>
                            {isMulti && p.maxTeachers && <span>👨‍🏫 Teachers: <strong>{p.maxTeachers}</strong></span>}
                            {isMulti && p.maxStaff && <span>👔 Staff: <strong>{p.maxStaff}</strong></span>}
                            {isMulti && p.maxCenters && <span>🏫 Centers: <strong>{p.maxCenters}</strong></span>}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Benefits Included:</span>
                          <ul className="space-y-1">
                            {p.features && p.features.map((feat, fidx) => (
                              <li key={fidx} className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0"></span>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-150 flex justify-between items-center font-bold">
                      <button
                        onClick={() => {
                          setPlans(plans.map(pl => pl.id === p.id ? { ...pl, status: pl.status === "Active" ? "Inactive" : "Active" } : pl));
                        }}
                        className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"}`}
                      >
                        {isActive ? "🟢 Active" : "🔴 Suspended"}
                      </button>

                      {plans.length > 5 && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete the plan "${p.name}"?`)) {
                              setPlans(plans.filter(pl => pl.id !== p.id));
                            }
                          }}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Global Student Fee Plans Panel */}
          <div className="lg:col-span-12 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm mt-8">
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Global Student Tuition Fee Plans (Franchise-wide)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define and assign the monthly tuition fee rate for each student learning plan. Changing these rates will update the monthly billing generated for all students assigned to these respective plans.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {((studentFeePlans && studentFeePlans.length > 0) ? studentFeePlans : [
                { id: "plan_std", name: "Standard Plan", monthlyFee: 2000 },
                { id: "plan_prem", name: "Premium Plan", monthlyFee: 3500 },
                { id: "plan_sch", name: "Scholarship Plan", monthlyFee: 500 }
              ]).map((plan) => {
                return (
                  <PlanFeeEditorCard
                    key={plan.id}
                    plan={plan}
                    onUpdate={onUpdateStudentFeePlan}
                  />
                );
              })}
            </div>
          </div>

        </div>
      )}

      {activeTab === "payments" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="payments-tab-view">
          {/* Left panel: Manual SaaS Invoice Raised */}
          <div className="lg:col-span-4 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm h-fit">
            <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Raise Custom AOS Invoice
            </h3>
            <p className="text-xs text-slate-500 mb-4">Raise a manual renewal fee or custom expansion bill for any Venture/Academy center.</p>

            {invSuccessMsg && (
              <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl p-3">
                {invSuccessMsg}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!invCenterId || !invPlanName || !invAmount) {
                alert("Please complete the invoice fields.");
                return;
              }
              try {
                const res = await fetch("/api/erp/saas-invoices", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    centerId: invCenterId,
                    planName: invPlanName,
                    amount: Number(invAmount),
                    dueDate: invDueDate,
                    status: "Unpaid"
                  })
                });
                const data = await res.json();
                if (data.success && data.invoice) {
                  setInvoices(prev => [data.invoice, ...prev]);
                  setInvAmount("");
                  setInvSuccessMsg(`Invoice ${data.invoice.id} raised successfully!`);
                  setTimeout(() => setInvSuccessMsg(""), 3000);
                } else {
                  alert("Failed to raise invoice: " + data.error);
                }
              } catch (err: any) {
                alert("Network error: " + err.message);
              }
            }} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Franchise Center Head</label>
                <select
                  required
                  value={invCenterId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setInvCenterId(cid);
                    const found = centers.find(c => c.id === cid);
                    if (found) {
                      setInvPlanName(found.plan);
                      setInvAmount(String(getPlanPrice(found)));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-indigo-950 outline-none focus:bg-white"
                >
                  <option value="">-- Choose Center --</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Selected Plan Tier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium 100 Plan"
                  value={invPlanName}
                  onChange={(e) => setInvPlanName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Invoice Fee (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 15000"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 outline-none focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 outline-none focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Raise AOS Bill</span>
              </button>
            </form>

            {/* AOS Payment & Banking Details Setup */}
            <div className="mt-6 pt-6 border-t border-slate-150">
              <h3 className="text-sm font-black text-indigo-950 font-display flex items-center gap-1.5 mb-1">
                <Landmark className="w-4 h-4 text-indigo-600 animate-pulse" />
                AOS Banking Details
              </h3>
              <p className="text-[10px] text-slate-500 mb-3">
                Configure payment gateways and bank transfer details that Venture/Academy admins will see on their billing dashboard.
              </p>

              {bankSettingsSaved && (
                <div className="mb-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] rounded-lg p-2 font-bold animate-fade-in">
                  ✓ Bank details updated and published successfully!
                </div>
              )}

              <form onSubmit={handleSaveSaasBankDetails} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Account Holder Name</label>
                  <input
                    type="text"
                    required
                    value={saasHolderName}
                    onChange={(e) => setSaasHolderName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Abacus Academy Pvt Ltd"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={saasBankName}
                      onChange={(e) => setSaasBankName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">IFSC Code</label>
                    <input
                      type="text"
                      required
                      value={saasIfscCode}
                      onChange={(e) => setSaasIfscCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 font-mono"
                      placeholder="e.g. HDFC0000123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Bank Account Number</label>
                  <input
                    type="text"
                    required
                    value={saasAccountNumber}
                    onChange={(e) => setSaasAccountNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="e.g. 502000456789"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">UPI ID (VPA)</label>
                  <input
                    type="text"
                    required
                    value={saasUpiId}
                    onChange={(e) => setSaasUpiId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="e.g. geniplus@upi"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Instruction Notes</label>
                  <textarea
                    rows={2}
                    value={saasPaymentNotes}
                    onChange={(e) => setSaasPaymentNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Send transfer screenshot to support desk."
                  />
                </div>

                <button
                  type="submit"
                  disabled={saasBankLoading}
                  className="w-full bg-slate-900 hover:bg-indigo-950 text-white font-black py-2.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 text-[11px] cursor-pointer"
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>{saasBankLoading ? "Saving Details..." : "Publish Bank Details"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right panel: AOS Invoice billing book & dynamic reminders */}
          <div className="lg:col-span-8 bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  AOS Revenue & Billing Book
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Collect contract fees, track outstanding ARR, and dispatch Payment Reminders.</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding AOS Dues</span>
                <span className="text-xl font-black text-rose-600 font-mono">
                  ₹{invoices.filter(i => i.status !== "Paid").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Invoices List */}
            <div className="space-y-4">
              {invoices.map((inv) => {
                const centerObj = centers.find(c => c.id === inv.centerId);
                const isPaid = inv.status === "Paid";
                const isOverdue = inv.status === "Overdue";
                
                return (
                  <div key={inv.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600">{inv.id}</span>
                        <strong className="text-sm font-bold text-slate-900 font-display">{inv.centerName}</strong>
                        <span className="text-[10px] text-slate-500 font-medium">({inv.planName})</span>
                      </div>

                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Billed Date: <strong className="font-mono text-slate-700">{inv.issuedDate}</strong> • Due: <strong className="font-mono text-slate-700">{inv.dueDate}</strong>
                          </span>
                        </div>

                        {isPaid && (
                          <div className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg w-fit">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Paid via {inv.paymentMode} on {inv.paidDate} (Ref: {inv.referenceId})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-2 shrink-0">
                      <div>
                        <span className="text-base font-black text-slate-900 font-mono">₹{inv.amount.toLocaleString()}</span>
                        <span className={`ml-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                          isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          isOverdue ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {inv.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 justify-end flex-wrap">
                        {/* Edit Bill button always visible for billing edits */}
                        <button
                          onClick={() => {
                            setEditingInvoice(inv);
                            setEditInvPlanName(inv.planName);
                            setEditInvAmount(String(inv.amount));
                            setEditInvDueDate(inv.dueDate);
                            setEditInvStatus(inv.status);
                          }}
                          className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95"
                        >
                          Edit Bill
                        </button>

                        {!isPaid && (
                          <>
                            {/* Collect payment button */}
                            <button
                              onClick={() => {
                                setCollectingInvoice(inv);
                                setPayRef("");
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              Collect Fee
                            </button>

                            {/* In-app payment reminder */}
                            <button
                              onClick={() => {
                                alert(`In-App billing alert successfully dispatched! Center Owner "${centerObj?.ownerName || 'Rajesh'}" will see a high-visibility warning at the top of their dashboard upon signing in.`);
                              }}
                              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                              title="In-App Notification"
                            >
                              <Send className="w-3 h-3 text-indigo-600" />
                              <span>In-App</span>
                            </button>

                            {/* WhatsApp Reminder */}
                            <button
                              onClick={() => {
                                const mobile = centerObj ? centerObj.mobile.replace(/\s+/g, "").replace(/-/g, "").replace(/\+/g, "") : "919999999999";
                                const text = `Dear ${centerObj?.ownerName || 'Center Head'}, this is the Abacus Academy Support Desk. Your center's Annual AOS subscription (${inv.planName}) of ₹${inv.amount.toLocaleString()} is currently ${inv.status.toLowerCase()}. Kindly make payment to preserve access to student/teacher portals. Settle instantly via UPI: abacus@upi. Thank you!`;
                                const url = `https://api.whatsapp.com/send?phone=${mobile}&text=${encodeURIComponent(text)}`;
                                window.open(url, "_blank");
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Send WhatsApp Invoice"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {invoices.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  🎉 No invoices generated yet. Use the Raise Invoice form to raise bills!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Center Tenant Modal Overlay */}
      {editingCenter && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex justify-center items-center p-4" id="edit-center-modal">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-left animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 font-display">Edit Franchise Center Tenant</h3>
              <p className="text-xs text-gray-500">Edit registration values, plan details, or overwrite passwords.</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Center Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Owner Name</label>
                <input
                  type="text"
                  required
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Registered Owner Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile No</label>
                <input
                  type="text"
                  required
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subscription Plan</label>
                <select
                  value={editPlan}
                  onChange={(e) => {
                    const selPlanName = e.target.value;
                    setEditPlan(selPlanName);
                    const matchedPlan = plans.find(p => p.name === selPlanName);
                    if (matchedPlan) {
                      const isMulti = matchedPlan.planType === "Multi-Center / Super Center" || (matchedPlan.maxCenters && Number(matchedPlan.maxCenters) > 1);
                      setEditIsSuperCenter(Boolean(isMulti));
                      setEditPlanType(isMulti ? "Multi-Center / Super Center" : "Standard Center");
                      if (matchedPlan.maxStudents) setEditStudentLimit(String(matchedPlan.maxStudents));
                      if (matchedPlan.maxTeachers) setEditTeacherLimit(String(matchedPlan.maxTeachers));
                      if (matchedPlan.maxStaff) setEditStaffLimit(String(matchedPlan.maxStaff));
                      if (matchedPlan.maxCenters) setEditCenterLimit(String(matchedPlan.maxCenters));
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                >
                  {plans.filter(p => p.status === "Active").map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.planType === "Multi-Center / Super Center" ? "Multi-Center" : "Standard"} - ₹{p.price.toLocaleString('en-IN')}/{p.billingCycle === "Monthly" ? "mo" : "yr"})</option>
                  ))}
                  <option value="Custom Plan">Custom Plan (Per Requirements)</option>
                </select>
              </div>

              {/* Super Center Architecture Configuration */}
              <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                    <span>👑 Super Center / Multi-Center Franchise</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsSuperCenter}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditIsSuperCenter(checked);
                        setEditPlanType(checked ? "Multi-Center / Super Center" : "Standard Center");
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-amber-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                  Enabling Super Center status designates this center as the <strong>Main Center</strong>. All limits below are shared across the Main Center and all connected Sub-Centers.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Shared Student Limit</label>
                    <input
                      type="number"
                      value={editStudentLimit}
                      onChange={(e) => setEditStudentLimit(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Shared Teacher Limit</label>
                    <input
                      type="number"
                      value={editTeacherLimit}
                      onChange={(e) => setEditTeacherLimit(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Shared Staff Limit</label>
                    <input
                      type="number"
                      value={editStaffLimit}
                      onChange={(e) => setEditStaffLimit(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Sub-Center Limit</label>
                    <input
                      type="number"
                      value={editCenterLimit}
                      onChange={(e) => setEditCenterLimit(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Custom Plan Amount manual input for Edit */}
              {(editPlan === "Custom Plan" || editPlan === "Custom") && (
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-1">
                  <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Custom Plan Amount (INR/year)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 150000"
                    value={editCustomPrice}
                    onChange={(e) => setEditCustomPrice(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-indigo-950 focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                  <div className="text-[9px] text-indigo-700 font-medium pt-1">
                    ✨ Custom Plan grants unlimited teachers & students.
                  </div>
                </div>
              )}

              {/* Edit multiple addresses */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Center Addresses / Branches</label>
                  <button
                    type="button"
                    onClick={() => setEditAddresses([...editAddresses, ""])}
                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Branch
                  </button>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                  {editAddresses.map((addr, idx) => (
                    <div key={idx} className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        placeholder="Address branch location"
                        value={addr}
                        onChange={(e) => {
                          const updated = [...editAddresses];
                          updated[idx] = e.target.value;
                          setEditAddresses(updated);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                      {editAddresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditAddresses(editAddresses.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account Secret Password</label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCenter(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  {editSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Center Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SaaS Invoice Fee Collection Modal */}
      {collectingInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex justify-center items-center p-4" id="collect-invoice-modal">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-left animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 font-display">Collect Subscription Payment</h3>
              <p className="text-xs text-slate-500">Log manual or bank transactions to clear center invoice outstanding dues.</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Billing Information</div>
                <div className="font-extrabold text-slate-800 text-sm">{collectingInvoice.centerName}</div>
                <div className="text-slate-600 font-medium font-mono">Plan: {collectingInvoice.planName} • Invoice: {collectingInvoice.id}</div>
                <div className="text-indigo-600 font-black text-base mt-1 font-mono">Amount due: ₹{collectingInvoice.amount.toLocaleString('en-IN')}/-</div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Receipt Reference ID (UPI / Bank UTR)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI883901237 or NETBANK-2883"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Method</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 outline-none"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="Bank Direct">Bank Direct / NEFT</option>
                    <option value="Cash / Hand">Cash / Hand Payment</option>
                    <option value="Cheque Clearance">Cheque Clearance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectingInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!payRef.trim()) {
                      alert("Please provide a payment reference receipt transaction ID.");
                      return;
                    }
                    try {
                      const res = await fetch("/api/erp/saas-invoices/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: collectingInvoice.id,
                          status: "Paid",
                          paymentMode: payMode,
                          referenceId: payRef,
                          paidDate: payDate
                        })
                      });
                      const data = await res.json();
                      if (data.success && data.invoice) {
                        setInvoices(prev => prev.map(inv => inv.id === collectingInvoice.id ? data.invoice : inv));
                        setCollectingInvoice(null);
                      } else {
                        alert("Failed to update invoice: " + data.error);
                      }
                    } catch (err: any) {
                      alert("Network error: " + err.message);
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Settle Invoice (Unpaid ➜ Paid)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="bg-indigo-950 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider font-display text-amber-400">Edit Subscription Invoice</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">ID: {editingInvoice.id} • {editingInvoice.centerName}</p>
              </div>
              <button
                onClick={() => setEditingInvoice(null)}
                className="text-indigo-300 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Plan Name / Description</label>
                <input
                  type="text"
                  required
                  value={editInvPlanName}
                  onChange={(e) => setEditInvPlanName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Invoice Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={editInvAmount}
                  onChange={(e) => setEditInvAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={editInvDueDate}
                  onChange={(e) => setEditInvDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                <select
                  value={editInvStatus}
                  onChange={(e) => setEditInvStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!editInvPlanName.trim() || !editInvAmount.trim()) {
                      alert("Please provide a plan name and non-empty invoice amount.");
                      return;
                    }
                    const amt = parseFloat(editInvAmount);
                    if (isNaN(amt) || amt < 0) {
                      alert("Please enter a valid invoice amount.");
                      return;
                    }
                    try {
                      const res = await fetch("/api/erp/saas-invoices/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: editingInvoice.id,
                          planName: editInvPlanName.trim(),
                          amount: amt,
                          dueDate: editInvDueDate,
                          status: editInvStatus
                        })
                      });
                      const data = await res.json();
                      if (data.success && data.invoice) {
                        setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? data.invoice : inv));
                        setEditingInvoice(null);
                      } else {
                        alert("Failed to save invoice changes: " + data.error);
                      }
                    } catch (err: any) {
                      alert("Network error: " + err.message);
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Invoice Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "accounting" && (
        <div className="space-y-6 animate-fade-in" id="superadmin-accounting-tab">
          <AccountingView
            currentUser={{
              email: "admin@geniplus.com",
              name: "Super Admin",
              role: "Super Admin",
              centerId: null
            }}
            centers={centers || []}
            teachers={teachers}
            students={students}
            fees={fees}
            onRefreshData={async () => {
              if (onRefreshData) onRefreshData();
            }}
          />
        </div>
      )}

      {activeTab === "logs" && (
        <div className="space-y-6 animate-fade-in" id="superadmin-activity-logs-tab">
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  System-Wide AOS Activity Logs
                </h3>
                <p className="text-xs text-slate-500">Comprehensive, real-time audit trail of all franchise branch operations and admin actions.</p>
              </div>
              <button
                onClick={onRefreshData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Real-time Logs</span>
              </button>
            </div>

            {/* Filters panel */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Filter by Date</label>
                <input
                  type="date"
                  value={logFilterDate}
                  onChange={(e) => setLogFilterDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Filter by User</label>
                <input
                  type="text"
                  placeholder="Search user name..."
                  value={logFilterUser}
                  onChange={(e) => setLogFilterUser(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Filter by Center</label>
                <select
                  value={logFilterCenter}
                  onChange={(e) => setLogFilterCenter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">All Centers</option>
                  {centers.map(center => (
                    <option key={center.id} value={center.id}>{center.name} ({center.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Filter by Action</label>
                <select
                  value={logFilterAction}
                  onChange={(e) => setLogFilterAction(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">All Actions</option>
                  <option value="Student Creation">Student Creation</option>
                  <option value="Student Edit">Student Edit</option>
                  <option value="Student Delete">Student Delete</option>
                  <option value="Lead Creation">Lead Creation</option>
                  <option value="Lead Status Changes">Lead Status Changes</option>
                  <option value="Demo Scheduling">Demo Scheduling</option>
                  <option value="Demo Rescheduling">Demo Rescheduling</option>
                  <option value="Invoice Creation">Invoice Creation</option>
                  <option value="Invoice Edit">Invoice Edit</option>
                  <option value="Invoice Delete">Invoice Delete</option>
                  <option value="Invoice Paid">Invoice Paid</option>
                  <option value="Attendance Changes">Attendance Changes</option>
                  <option value="Homework Assignment">Homework Assignment</option>
                  <option value="Material Dispatch">Material Dispatch</option>
                </select>
              </div>
              <div className="flex items-end justify-end">
                <button
                  onClick={() => {
                    setLogFilterDate("");
                    setLogFilterUser("");
                    setLogFilterAction("");
                    setLogFilterCenter("");
                  }}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono uppercase tracking-wider">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Franchise Branch</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const userVal = logFilterUser.toLowerCase();

                      const filtered = activityLogs.filter(log => {
                        if (logFilterDate && log.date !== logFilterDate) return false;
                        if (userVal && !log.userName.toLowerCase().includes(userVal)) return false;
                        if (logFilterAction && log.action !== logFilterAction) return false;
                        if (logFilterCenter && log.centerId !== logFilterCenter) return false;
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold text-xs">
                              No matching system-wide activity logs found.
                            </td>
                          </tr>
                        );
                      }

                      // Sort logs descending by timestamp
                      const sortedLogs = [...filtered].sort((a, b) => b.id.localeCompare(a.id));

                      return sortedLogs.map((log: any) => {
                        let badgeStyle = "bg-slate-50 text-slate-600 border-slate-100";
                        if (log.action.includes("Creation")) badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                        else if (log.action.includes("Edit") || log.action.includes("Reschedule")) badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";
                        else if (log.action.includes("Delete")) badgeStyle = "bg-rose-50 text-rose-700 border-rose-100";
                        else if (log.action.includes("Paid")) badgeStyle = "bg-blue-50 text-blue-700 border-blue-100";

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-slate-400">
                              <span className="block font-bold text-slate-700">{log.date}</span>
                              <span className="text-[10px]">{log.time}</span>
                            </td>
                            <td className="p-3 font-extrabold text-slate-900">{log.userName}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700">
                                {log.role}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${badgeStyle}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="p-3 font-extrabold text-indigo-950">
                              {log.centerName || log.centerId || "Central HQ"}
                              <span className="block text-[9px] font-mono text-slate-400 font-normal">ID: {log.centerId}</span>
                            </td>
                            <td className="p-3 font-medium text-slate-600 max-w-xs truncate" title={log.details}>
                              {log.details}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "diagnostics" && (
        <SystemDiagnosticsView />
      )}

      {activeTab === "inventory" && (
        <div className="space-y-6 animate-fade-in" id="superadmin-inventory-tab">
          {/* Metrics Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Sales Revenue</div>
              <div className="text-xl font-black text-indigo-950 mt-2 font-display">
                ₹{(materialOrders || []).filter(o => o.paymentStatus === "Paid").reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-bold">
                <span>✓ Verified Payments</span>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pending Orders</div>
              <div className="text-xl font-black text-amber-500 mt-2 font-display">
                {(materialOrders || []).filter(o => o.status === "Pending").length}
              </div>
              <div className="text-[10px] text-amber-600 mt-1 flex items-center gap-1 font-semibold">
                <span>Requires Verification / Dispatch</span>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Verified Deposits</div>
              <div className="text-xl font-black text-indigo-600 mt-2 font-display">
                {(materialOrders || []).filter(o => o.paymentStatus === "Paid").length} / {(materialOrders || []).length}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <span>UTR confirmation rate</span>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Products</div>
              <div className="text-xl font-black text-emerald-600 mt-2 font-display">
                {(materialProducts || []).length}
              </div>
              <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-bold">
                <span>🎒 Catalog in-stock</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-6">
            {/* Tab header and selection */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div className="text-left">
                <h3 className="text-base font-black text-indigo-900 font-display flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  Material Inventory & Ordering Control Desk
                </h3>
                <p className="text-xs text-slate-500">Manage franchise material items, dispatch orders, weight-based calculations, and public storefront.</p>
              </div>

              {/* Sub-tabs buttons */}
              <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
                {[
                  { id: "products" as const, label: "📦 Catalog" },
                  { id: "orders" as const, label: "📋 Orders" },
                  { id: "shipping" as const, label: "⚙️ Shipping Rules" }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setInvSubTab(sub.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      invSubTab === sub.id
                        ? "bg-white text-indigo-900 shadow-sm"
                        : "text-slate-500 hover:text-indigo-600"
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtab products content */}
            {invSubTab === "products" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-extrabold text-slate-900 font-display uppercase tracking-wide">
                    Active Learning Items ({(materialProducts || []).length})
                  </h4>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProdName("");
                      setProdDesc("");
                      setProdPrice(0);
                      setProdWeight(0);
                      setProdStock(100);
                      setProdLink("");
                      setProdImage("");
                      setShowProductModal(true);
                    }}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-600/10"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                  {(materialProducts || []).map((p: any) => (
                    <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-xs transition-all">
                      <div className="space-y-2">
                        {p.image && (
                          <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 mb-3 bg-slate-100 flex items-center justify-center">
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {p.id}
                            </span>
                            <h5 className="font-extrabold text-sm text-slate-900 font-display mt-1 leading-snug">{p.name}</h5>
                          </div>
                          <span className="font-mono text-sm font-black text-indigo-900 shrink-0">
                            ₹{p.price}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{p.description || "No description provided."}</p>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-[10px] font-mono text-slate-500 border-t border-slate-200/60 mt-2">
                          <span className="flex items-center gap-0.5">⚖️ {p.weight}g</span>
                          <span className="flex items-center gap-0.5">📦 Stock: {p.stock} units</span>
                          {p.orderLink && (
                            <a href={p.orderLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-0.5">
                              🔗 Order URL
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 border-t border-slate-200/60 pt-3">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setProdName(p.name);
                            setProdDesc(p.description || "");
                            setProdPrice(p.price);
                            setProdWeight(p.weight || 0);
                            setProdStock(p.stock || 0);
                            setProdLink(p.orderLink || "");
                            setProdImage(p.image || "");
                            setShowProductModal(true);
                          }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modal for adding/editing product */}
                {showProductModal && (
                  <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-4 animate-scale-up text-left">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h4 className="text-sm font-black text-indigo-950 font-display uppercase tracking-wide">
                          {editingProduct ? "✏️ Edit Product Details" : "✨ Create New Learning Item"}
                        </h4>
                        <button
                          onClick={() => {
                            setShowProductModal(false);
                            setEditingProduct(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={handleSaveProduct} className="space-y-4 text-left">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Product Name</label>
                          <input
                            type="text"
                            required
                            value={prodName}
                            onChange={e => setProdName(e.target.value)}
                            placeholder="e.g. Abacus Starter Tool"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                          <textarea
                            rows={2}
                            value={prodDesc}
                            onChange={e => setProdDesc(e.target.value)}
                            placeholder="Briefly describe the contents or level..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Price (₹)</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={prodPrice}
                              onChange={e => setProdPrice(Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Weight (g)</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={prodWeight}
                              onChange={e => setProdWeight(Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Stock (units)</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={prodStock}
                              onChange={e => setProdStock(Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">External Order link (Optional)</label>
                          <input
                            type="url"
                            value={prodLink}
                            onChange={e => setProdLink(e.target.value)}
                            placeholder="WhatsApp order link or webpage"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Product Image</label>
                          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                            {prodImage ? (
                              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-200 shrink-0">
                                <img src={prodImage} alt="Product Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => setProdImage("")}
                                  className="absolute inset-0 bg-black/60 text-white font-extrabold text-[9px] uppercase flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px] font-bold shrink-0 bg-white">
                                NO IMAGE
                              </div>
                            )}
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="prod-image-file-input"
                              />
                              <label
                                htmlFor="prod-image-file-input"
                                className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
                              >
                                <Image className="w-3.5 h-3.5 text-indigo-600" />
                                Upload Photo
                              </label>
                              <div className="text-[9px] text-slate-400 mt-1">Select PNG, JPG, or JPEG file</div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer shadow-md"
                        >
                          {editingProduct ? "Update Product" : "Publish Product"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Subtab orders content */}
            {invSubTab === "orders" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900 font-display uppercase tracking-wide text-left">
                    Incoming Shipments & UTR Verification Desk ({(materialOrders || []).length})
                  </h4>
                </div>

                {/* Orders List Table */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Buyer Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Weight (g)</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3">Delivery Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {(materialOrders || []).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold bg-white">
                            No incoming material orders have been placed yet.
                          </td>
                        </tr>
                      ) : (
                        (materialOrders || []).map((o: any) => {
                          const isExpanded = expandedOrderId === o.id;
                          return (
                            <React.Fragment key={o.id}>
                              <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? "bg-indigo-50/20" : ""}`}>
                                <td className="p-3 font-mono font-bold text-indigo-900">#{o.id}</td>
                                <td className="p-3 font-semibold text-slate-800">{o.buyerName}</td>
                                <td className="p-3 font-semibold text-slate-500">
                                  {o.buyerType === "Teacher" ? (
                                    <span className="bg-indigo-55 text-indigo-700 px-2 py-0.5 rounded text-[10px]">Dashboard Teacher</span>
                                  ) : (
                                    <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">External Partner</span>
                                  )}
                                </td>
                                <td className="p-3 font-mono font-bold text-slate-600">{o.totalWeight}g</td>
                                <td className="p-3 font-mono font-black text-slate-900">₹{o.totalAmount}</td>
                                <td className="p-3">
                                  {o.paymentStatus === "Paid" ? (
                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black text-[10px]">Verified (Paid)</span>
                                  ) : (
                                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-black text-[10px]">Pending Verification</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                                    o.status === "Delivered" ? "bg-emerald-50 text-emerald-700" :
                                    o.status === "Shipped" ? "bg-sky-50 text-sky-700" :
                                    o.status === "Cancelled" ? "bg-rose-50 text-rose-700" :
                                    "bg-amber-50 text-amber-700"
                                  }`}>
                                    {o.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1 ml-auto"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{isExpanded ? "Hide Details" : "Verify & Dispatch"}</span>
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded panel details */}
                              {isExpanded && (
                                <tr className="bg-indigo-50/10">
                                  <td colSpan={8} className="p-5 border-t border-slate-100">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left">
                                      {/* Order details */}
                                      <div className="md:col-span-4 space-y-3.5 text-xs text-left">
                                        <h5 className="font-extrabold text-slate-900 uppercase tracking-wide text-[10px] text-indigo-600">👤 Buyer Details</h5>
                                        <p><span className="text-slate-400 font-bold">Name:</span> <span className="text-slate-800 font-semibold">{o.buyerName}</span></p>
                                        <p><span className="text-slate-400 font-bold">Email:</span> <span className="text-slate-800 font-semibold">{o.buyerEmail || "N/A"}</span></p>
                                        <p><span className="text-slate-400 font-bold">Phone:</span> <span className="text-indigo-600 font-semibold font-mono">{o.buyerPhone || "N/A"}</span></p>
                                        <div>
                                          <span className="text-slate-400 font-bold block mb-1">Shipping Courier Address:</span>
                                          <span className="text-slate-700 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100 block whitespace-pre-line leading-relaxed text-[11px]">
                                            {o.address || "No address provided."}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Items list */}
                                      <div className="md:col-span-5 space-y-3 text-left">
                                        <h5 className="font-extrabold text-slate-900 uppercase tracking-wide text-[10px] text-indigo-600">📦 Selected Products</h5>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                          {(o.items || []).map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-1.5 text-[11px] font-semibold text-slate-700">
                                              <span>{item.name} × {item.quantity}</span>
                                              <span className="font-mono text-slate-900">₹{item.price * item.quantity}</span>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="pt-2 text-[11px] font-bold text-slate-500 flex justify-between">
                                          <span>Subtotal: ₹{o.subtotal}</span>
                                          <span>Courier: ₹{o.shippingCharge}</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 font-black text-xs text-indigo-950 flex justify-between">
                                          <span>GRAND TOTAL</span>
                                          <span>₹{o.totalAmount}</span>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-slate-700 font-bold">
                                          <p className="text-[10px] uppercase text-amber-800 flex items-center gap-1">🏦 UPI Reference Code</p>
                                          <p className="font-mono text-xs text-slate-900 mt-1 select-all bg-white px-2 py-1 rounded border border-amber-200/50 block w-fit">
                                            {o.paymentRef || "No reference provided"}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Update status form */}
                                      <div className="md:col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4 text-left">
                                        <h5 className="font-extrabold text-slate-900 uppercase tracking-wide text-[10px]">⚙️ Verify & Update Status</h5>
                                        
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-500 uppercase">Payment Status</label>
                                          <select
                                            id={`payment-status-select-${o.id}`}
                                            defaultValue={o.paymentStatus}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-hidden"
                                          >
                                            <option value="Pending">Pending Verification</option>
                                            <option value="Paid">Verified (Paid)</option>
                                          </select>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-500 uppercase">Delivery Stage</label>
                                          <select
                                            id={`delivery-status-select-${o.id}`}
                                            defaultValue={o.status}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-hidden"
                                          >
                                            <option value="Pending">Pending Dispatch</option>
                                            <option value="Shipped">Dispatched (Transit)</option>
                                            <option value="Delivered">Delivered (Completed)</option>
                                            <option value="Cancelled">Cancelled</option>
                                          </select>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-500 uppercase">Tracking Number (Courier)</label>
                                          <input
                                            type="text"
                                            id={`tracking-number-input-${o.id}`}
                                            defaultValue={o.trackingNumber}
                                            placeholder="e.g. DTDC81920"
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold focus:outline-hidden"
                                          />
                                        </div>

                                        <button
                                          onClick={() => {
                                            const pStatus = (document.getElementById(`payment-status-select-${o.id}`) as HTMLSelectElement).value;
                                            const dStatus = (document.getElementById(`delivery-status-select-${o.id}`) as HTMLSelectElement).value;
                                            const tNum = (document.getElementById(`tracking-number-input-${o.id}`) as HTMLInputElement).value;
                                            handleUpdateOrderStatus(o.id, dStatus, pStatus, tNum);
                                          }}
                                          disabled={updatingOrderId === o.id}
                                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 rounded-lg transition-all shadow-xs cursor-pointer text-center"
                                        >
                                          {updatingOrderId === o.id ? "Updating state..." : "Save State Change"}
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Subtab shipping content */}
            {invSubTab === "shipping" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
                {/* Form column */}
                <form onSubmit={handleSaveShippingSettings} className="md:col-span-7 space-y-6 text-left">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900 font-display uppercase tracking-wide">
                      Weight-Based Shipping Charges rules
                    </h4>
                    <p className="text-xs text-slate-500">Configure global automated shipping fees based on package weight steps.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Base Weight Limit (grams)</label>
                        <input
                          type="number"
                          required
                          value={shipBaseLimit}
                          onChange={e => setShipBaseLimit(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[9px] text-slate-400">Weight covered under base charge (e.g. 500g).</span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Base Courier Charge (₹)</label>
                        <input
                          type="number"
                          required
                          value={shipBaseCharge}
                          onChange={e => setShipBaseCharge(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[9px] text-slate-400">Standard charge for base weight (e.g. ₹60).</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Additional Weight Step (grams)</label>
                        <input
                          type="number"
                          required
                          value={shipStep}
                          onChange={e => setShipStep(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[9px] text-slate-400 font-medium">Grams step unit for extra weights (e.g. 500g).</span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Additional Charge per Step (₹)</label>
                        <input
                          type="number"
                          required
                          value={shipStepCharge}
                          onChange={e => setShipStepCharge(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[9px] text-slate-400 font-medium">Charge added for each extra step (e.g. ₹40).</span>
                      </div>
                    </div>
                  </div>

                  {shippingSaveSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs font-bold animate-pulse">
                      ✓ Shipping rules saved successfully to academy database and synced to Firestore!
                    </div>
                  )}

                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    Save Shipping Settings
                  </button>
                </form>

                {/* External link column */}
                <div className="md:col-span-5 bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 text-left">
                  <h4 className="text-sm font-extrabold text-indigo-950 font-display flex items-center gap-1">
                    <Settings2 className="w-4 h-4 text-indigo-600" />
                    Share Public Order Link
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Independent teachers, affiliates, or schools who do NOT use this ERP dashboard can easily place orders using the secure public link.
                  </p>
                  
                  <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-2 text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Secure Ordering desk URL</span>
                    <div className="bg-slate-50 p-2 rounded-lg font-mono text-[11px] text-slate-700 select-all break-all border border-slate-100">
                      {window.location.origin}/order-materials
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + "/order-materials");
                      alert("Public Order desk Link copied to clipboard!");
                    }}
                    type="button"
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <ClipboardCopy className="w-4 h-4" />
                    <span>Copy Shareable URL</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teacher Training Program & 1-Month Trial CRM View */}
      {activeTab === "teacher_training" && (
        <div className="space-y-6 animate-fade-in font-sans text-left" id="teacher-training-tab-view">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Abacus Teacher LMS Academy
                </span>
                <h3 className="text-xl md:text-2xl font-black font-display mt-2.5">
                  Teacher Training Program & Pedagogy Studio 🚀
                </h3>
                <p className="text-xs text-indigo-200 mt-1 max-w-3xl leading-relaxed">
                  Manage enrolled Abacus Teacher Trainees, build Level 1–8 pedagogy guides & video modules, use interactive projection smartboard, and generate practice worksheets.
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddTraineeModal(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register Trainee</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenBatchModal()}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Create New Batch</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCourseModal()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>+ Create LMS Course</span>
                </button>
              </div>
            </div>

            {/* Inner Navigation Pills */}
            <div className="mt-6 flex gap-2 border-t border-white/10 pt-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setTeacherTrainingSubTab("roster")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  teacherTrainingSubTab === "roster"
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>👥 Enrolled Trainees & CRM Trial Roster ({trainees.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTeacherTrainingSubTab("live_batches")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  teacherTrainingSubTab === "live_batches"
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                <Video className="w-4 h-4" />
                <span>📹 Live Training Batches ({liveBatches.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTeacherTrainingSubTab("lms_courses")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  teacherTrainingSubTab === "lms_courses"
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>📚 Teacher LMS Courses & Pedagogy Studio ({courses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTeacherTrainingSubTab("abacus_smartboard")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  teacherTrainingSubTab === "abacus_smartboard"
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>🧮 Abacus Projection Smartboard</span>
              </button>

              <button
                type="button"
                onClick={() => setTeacherTrainingSubTab("worksheet_generator")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  teacherTrainingSubTab === "worksheet_generator"
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>📄 Practice Worksheet Generator</span>
              </button>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Enrolled Trainees</div>
              <div className="text-2xl md:text-3xl font-black text-indigo-600 mt-1 font-display">{trainees.length} Trainees</div>
              <p className="text-[10px] text-slate-500 mt-1">Abacus Certification Program</p>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">LMS Pedagogy Courses</div>
              <div className="text-2xl md:text-3xl font-black text-purple-600 mt-1 font-display">{courses.length} Courses</div>
              <p className="text-[10px] text-purple-600 font-bold mt-1">Level 1-8 Modules & Quizzes</p>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">30-Day Trial CRM Active</div>
              <div className="text-2xl md:text-3xl font-black text-emerald-600 mt-1 font-display">
                {trainees.filter(t => t.trialActivated).length} Centers
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">Provisioned with 1-Click</p>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Portal Practice Access</div>
              <div className="text-2xl md:text-3xl font-black text-amber-600 mt-1 font-display">
                {trainees.filter(t => t.studentPortalAccess).length} Active
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Can practice worksheets & drills</p>
            </div>
          </div>

          {/* TAB 1: ROSTER VIEW */}
          {teacherTrainingSubTab === "roster" && (
            <div className="space-y-6">
              {/* Search & Filter Bar */}
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    placeholder="Search teacher trainee by name, email, mobile or city..."
                    value={traineeSearch}
                    onChange={(e) => setTraineeSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Trainees Roster Table */}
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h4 className="font-black text-sm text-slate-900 font-display flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Enrolled Abacus Teacher Trainees & 1-Click CRM Trial Status
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Showing {trainees.filter(t => !traineeSearch || t.name.toLowerCase().includes(traineeSearch.toLowerCase()) || t.email.toLowerCase().includes(traineeSearch.toLowerCase())).length} Records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 px-5">Trainee Name & Contact</th>
                        <th className="py-3 px-4">Location & Date</th>
                        <th className="py-3 px-4">Training Level</th>
                        <th className="py-3 px-4">Student Practice Mode</th>
                        <th className="py-3 px-4">Trial CRM Status</th>
                        <th className="py-3 px-5 text-right">Actions / 1-Click Trial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {trainees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                            No teacher trainees registered yet. Click "Register Teacher Trainee" above to get started.
                          </td>
                        </tr>
                      ) : (
                        trainees
                          .filter(t => !traineeSearch || t.name.toLowerCase().includes(traineeSearch.toLowerCase()) || t.email.toLowerCase().includes(traineeSearch.toLowerCase()) || t.city?.toLowerCase().includes(traineeSearch.toLowerCase()))
                          .map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-900 font-black text-sm flex items-center justify-center shrink-0 uppercase shadow-2xs">
                                    {t.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-slate-900 text-sm font-display">{t.name}</div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                      <span>📧 {t.email}</span>
                                      <span>• 📱 {t.mobile}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4 font-semibold text-slate-700">
                                <div>📍 {t.city || "City"}, {t.state || "State"}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Enrolled: {t.enrollmentDate}</div>
                              </td>

                              <td className="py-4 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                                    Level {t.currentTrainingLevel || 1}
                                  </span>
                                  <select
                                    value={t.currentTrainingLevel || 1}
                                    onChange={(e) => handleUpdateTraineeLevel(t, Number(e.target.value))}
                                    className="bg-slate-100 border border-slate-200 text-[10px] font-bold rounded px-1 py-0.5 text-slate-800 outline-none"
                                  >
                                    {[1,2,3,4,5,6,7,8].map(lvl => (
                                      <option key={lvl} value={lvl}>Level {lvl}</option>
                                    ))}
                                  </select>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTraineeStudentAccess(t)}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                                    t.studentPortalAccess
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {t.studentPortalAccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                                  <span>{t.studentPortalAccess ? "Enabled (Student Portal)" : "Disabled"}</span>
                                </button>
                              </td>

                              <td className="py-4 px-4">
                                {t.trialActivated ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-black">
                                      <Rocket className="w-3 h-3 text-emerald-600 animate-pulse" />
                                      30-Day CRM Trial Active
                                    </span>
                                    <div className="text-[10px] text-slate-500 font-medium">Expires: {t.trialEndsAt}</div>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    Trial Not Active Yet
                                  </span>
                                )}
                              </td>

                              <td className="py-4 px-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleActivateTrial(t)}
                                    disabled={activatingTrialId === t.id}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                                      t.trialActivated
                                        ? "bg-slate-100 hover:bg-slate-200 text-indigo-950 border border-slate-300"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 active:scale-95"
                                    }`}
                                  >
                                    {activatingTrialId === t.id ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Rocket className="w-3.5 h-3.5" />
                                    )}
                                    <span>{t.trialActivated ? "Re-issue Credentials" : "🚀 1-Click 1-Mo Trial"}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTrainee(t.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                    title="Delete Trainee"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LMS COURSES & PEDAGOGY STUDIO */}
          {teacherTrainingSubTab === "lms_courses" && (
            <div className="space-y-6">
              {/* Category Filters */}
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 md:pb-0">
                  {["All", "Pedagogy & Finger Methods", "Anzan Speed Math", "Classroom Management", "Exam & Certification Prep"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCourseCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                        courseCategoryFilter === cat
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenCourseModal()}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create New Course</span>
                </button>
              </div>

              {/* Course Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses
                  .filter(c => courseCategoryFilter === "All" || c.category === courseCategoryFilter)
                  .map((c) => (
                    <div key={c.id} className="bg-white border-2 border-slate-100 hover:border-indigo-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                            {c.category}
                          </span>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                            c.isPublished ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {c.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>

                        <h4 className="text-base font-black text-slate-900 font-display leading-snug">
                          {c.title}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                          <div className="bg-slate-50 rounded-xl p-2">
                            <div className="text-[10px] font-black text-slate-400 uppercase">Level</div>
                            <div className="text-xs font-black text-indigo-950 mt-0.5">
                              {c.level === 0 ? "All Levels" : `Level ${c.level}`}
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2">
                            <div className="text-[10px] font-black text-slate-400 uppercase">Modules</div>
                            <div className="text-xs font-black text-purple-950 mt-0.5">
                              {c.modules?.length || 0} Units
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2">
                            <div className="text-[10px] font-black text-slate-400 uppercase">Duration</div>
                            <div className="text-xs font-black text-emerald-950 mt-0.5">
                              {c.durationHours || 10} Hrs
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCoursePreview(c)}
                            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Preview LMS View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAssignCourseToAll(c.title)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-black text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            title="Assign to All Trainees"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCourseModal(c)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                            title="Edit Course"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                            title="Delete Course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SubTab 3: Live Training Batches */}
          {teacherTrainingSubTab === "live_batches" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase">Live Training Cohort Batches</h4>
                  <p className="text-xs text-slate-500">Manage live Zoom/Meet schedules for Batch 001, Batch 002, and fast-track cohorts.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenBatchModal()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Create New Batch</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveBatches.map((b) => (
                  <div key={b.id || b.batchCode} className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4">
                    <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                          {b.batchCode}
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-1 font-display">{b.title}</h4>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        b.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {b.status || "Active"}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-400" /> <span className="font-bold">Trainer:</span> {b.instructorName}</div>
                      <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400" /> <span className="font-bold">Schedule:</span> {b.scheduleTime}</div>
                      <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /> <span className="font-bold">Dates:</span> {b.startDate} to {b.endDate}</div>
                    </div>

                    {b.notes && (
                      <p className="text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100 text-slate-600 italic">
                        "{b.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-2">
                      <a
                        href={b.meetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Google Meet</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleOpenBatchModal(b)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        Edit Batch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab 4: Abacus Projection Smartboard */}
          {teacherTrainingSubTab === "abacus_smartboard" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit">
                    <Calculator className="w-3.5 h-3.5" />
                    Teacher Training Smartboard
                  </span>
                  <h3 className="text-xl font-black font-display mt-2 text-white">
                    17-Rod Japanese Abacus Concept Projection Tool 🧮
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Interactive wooden virtual abacus for Super Admin to demonstrate finger mechanics, bead placement, Friends of 5, Friends of 10 formulas, and speed math calculations live to teacher trainees.
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-md overflow-hidden">
                <VirtualAbacus initialRods={17} initialTheme="wooden" initialType="japanese" />
              </div>
            </div>
          )}

          {/* SubTab 5: Practice Worksheet Generator */}
          {teacherTrainingSubTab === "worksheet_generator" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit">
                    <Sparkles className="w-3.5 h-3.5" />
                    Teacher Concept Drill Generator
                  </span>
                  <h3 className="text-xl font-black font-display mt-2 text-white">
                    Speed Worksheet & Practice Test Generator 📄
                  </h3>
                  <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                    Generate instant speed practice drill sheets, addition/subtraction/multiplication worksheets, and answer keys to give rigorous practice to teachers during training.
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-md overflow-hidden">
                <PracticeGeneratorView />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Batch Modal Overlay */}
      {/* Create / Edit Live Batch Modal Overlay (Screenshot 3 Matching) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" />
                <span>{editingBatch ? "Edit Live Training Batch" : "Create New Live Training Batch"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">BATCH CODE *</label>
                  <input
                    type="text"
                    required
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    placeholder="Batch 004"
                    className="w-full bg-slate-50 border-2 border-indigo-200 rounded-2xl p-3 text-xs font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">BATCH STATUS *</label>
                  <select
                    value={batchStatus}
                    onChange={(e) => setBatchStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border-2 border-indigo-100 rounded-2xl p-3 text-xs font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">BATCH TITLE *</label>
                <input
                  type="text"
                  required
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  placeholder="Live Abacus Teacher Certification Cohort"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">INSTRUCTOR / TRAINER NAME *</label>
                  <input
                    type="text"
                    required
                    value={batchInstructor}
                    onChange={(e) => setBatchInstructor(e.target.value)}
                    placeholder="e.g. Master Abacus Trainer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">SCHEDULE TIME</label>
                  <input
                    type="text"
                    value={batchSchedule}
                    onChange={(e) => setBatchSchedule(e.target.value)}
                    placeholder="Tue & Thu 05:00 PM - 06:30 PM IST"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">START DATE</label>
                  <input
                    type="date"
                    value={batchStartDate}
                    onChange={(e) => setBatchStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">END DATE</label>
                  <input
                    type="date"
                    value={batchEndDate}
                    onChange={(e) => setBatchEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">LIVE MEETING / ZOOM URL</label>
                <input
                  type="url"
                  value={batchMeetUrl}
                  onChange={(e) => setBatchMeetUrl(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">SYLLABUS & NOTES</label>
                <textarea
                  rows={2}
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="Interactive live training batch covering finger pedagogy, parent demo pitching, and speed drills."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3.5 rounded-2xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBatch}
                  className="w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingBatch ? "Saving..." : "SAVE LIVE BATCH 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Trainee Modal Overlay */}
      {showAddTraineeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Register New Teacher Trainee
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTraineeModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTrainee} className="space-y-4">
              {/* Teacher Account Selection */}
              <div className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-100 space-y-1.5">
                <label className="block text-[10px] font-black text-indigo-900 uppercase">Select Registered Teacher OR Create New *</label>
                <select
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (selectedId) {
                      const t = teachers.find(teacher => teacher.id === selectedId);
                      if (t) {
                        setNewTraineeName(t.name);
                        setNewTraineeEmail(t.email);
                        setNewTraineeMobile(t.mobile || "");
                        setNewTraineeCity((t as any).centerName || "");
                      }
                    }
                  }}
                  className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">➕ Create / Enter New Teacher Account</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      👤 {t.name} ({t.email} • {(t as any).centerName || "Center Teacher"})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-indigo-700 font-medium leading-tight">
                  Selecting an existing teacher automatically populates their details and assigns this training course directly to their account.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newTraineeName}
                  onChange={(e) => setNewTraineeName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Email ID *</label>
                  <input
                    type="email"
                    required
                    value={newTraineeEmail}
                    onChange={(e) => setNewTraineeEmail(e.target.value)}
                    placeholder="ananya@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={newTraineeMobile}
                    onChange={(e) => setNewTraineeMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={newTraineeCity}
                    onChange={(e) => setNewTraineeCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Initial Level</label>
                  <select
                    value={newTraineeLevel}
                    onChange={(e) => setNewTraineeLevel(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {[0,1,2,3,4,5,6,7,8].map(lvl => (
                      <option key={lvl} value={lvl}>{lvl === 0 ? "Level 0 (Foundation Pedagogy)" : `Level ${lvl} Abacus Pedagogy`}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Enrollment Path Selection: Recorded Course vs Live Batch */}
              <div className="space-y-2 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80">
                <label className="block text-[10px] font-black text-amber-900 uppercase">Training Program Delivery Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTraineeEnrollmentType("recorded_course")}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      newTraineeEnrollmentType === "recorded_course"
                        ? "bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50"
                    }`}
                  >
                    <div className="text-xs font-extrabold">1. Recorded Course</div>
                    <div className="text-[9px] opacity-80">Level 0-8 step-by-step</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTraineeEnrollmentType("live_batch")}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      newTraineeEnrollmentType === "live_batch"
                        ? "bg-indigo-600 text-white border-indigo-700 font-black shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="text-xs font-extrabold">2. Live Batch-wise</div>
                    <div className="text-[9px] opacity-80">Batch 001, 002 Zoom cohorts</div>
                  </button>
                </div>

                {newTraineeEnrollmentType === "live_batch" && (
                  <div className="pt-2 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black text-indigo-900 uppercase">Assign Live Session Cohort Batch *</label>
                      <button
                        type="button"
                        onClick={() => handleOpenBatchModal()}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 underline cursor-pointer flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>+ Create New Batch</span>
                      </button>
                    </div>
                    <select
                      value={newTraineeBatch}
                      onChange={(e) => setNewTraineeBatch(e.target.value)}
                      className="w-full bg-white border border-indigo-300 rounded-xl p-2.5 text-xs font-extrabold text-indigo-950 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {liveBatches.map((b) => (
                        <option key={b.id || b.batchCode} value={b.batchCode}>
                          {b.batchCode} - {b.title} ({b.status || "Active"})
                        </option>
                      ))}
                      <option value="Batch 001">Batch 001 - July Morning Cohort</option>
                      <option value="Batch 002">Batch 002 - August Evening Cohort</option>
                      <option value="Batch 003">Batch 003 - Weekend Fast-track</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100">
                <input
                  type="checkbox"
                  id="student-access-chk"
                  checked={newTraineeStudentAccess}
                  onChange={(e) => setNewTraineeStudentAccess(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="student-access-chk" className="text-xs font-extrabold text-indigo-950 cursor-pointer">
                  Grant Student Portal Practice Mode Access
                  <span className="block text-[10px] font-normal text-indigo-700">
                    Allows trainee to practice flashcards, speed drills & worksheets as a student.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTraineeModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTrainee}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSavingTrainee ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                  <span>Save Teacher Trainee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trial Activation Success Modal Dialog */}
      {trialSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 text-left space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <Rocket className="w-6 h-6 animate-bounce" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 font-display">
                🎉 1-Month Trial CRM Center Provisioned!
              </h3>
              <p className="text-xs text-slate-500">
                Trial center created for <strong className="text-indigo-900">{trialSuccessModal.traineeName}</strong>. Valid until <strong>{trialSuccessModal.trialEndsAt}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase block">Center Name</span>
                <span className="font-extrabold text-indigo-950 font-display">{trialSuccessModal.centerName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Login Email</span>
                  <span className="font-mono font-bold text-slate-800">{trialSuccessModal.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Password</span>
                  <span className="font-mono font-extrabold text-emerald-700">{trialSuccessModal.password}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const text = `🎉 Abacus Teacher 1-Month Trial CRM Credentials:\nCenter: ${trialSuccessModal.centerName}\nEmail: ${trialSuccessModal.email}\nPassword: ${trialSuccessModal.password}\nTrial Ends: ${trialSuccessModal.trialEndsAt}`;
                  navigator.clipboard.writeText(text);
                  alert("Trial login details copied to clipboard!");
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ClipboardCopy className="w-4 h-4" />
                <span>Copy Credentials to Share on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setTrialSuccessModal(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-2xl transition-all cursor-pointer text-center"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "landing_cms" && (
        <div className="space-y-6 animate-fade-in font-sans text-left">
          <div className="bg-white border-2 border-slate-150 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <span>Public Landing Page CMS & Hero Customizer</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage the public landing page hero banner, headings, promotional images, primary buttons, and footer contact details.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="?view=landing"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>Preview Landing Page</span>
                </a>
              </div>
            </div>

            {cmsSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Landing Page content published successfully! All visitors will see your updated headlines and images.</span>
              </div>
            )}

            <form onSubmit={handleSaveCMS} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hero Section */}
                <div className="space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-950 font-display flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Hero Banner & Copy
                  </h4>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Hero Main Headline</label>
                    <textarea
                      rows={2}
                      value={cmsHeadline}
                      onChange={(e) => setCmsHeadline(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Empower Young Minds With Master Abacus Genius Training"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Sub-headline / Supporting Copy</label>
                    <textarea
                      rows={3}
                      value={cmsSubtitle}
                      onChange={(e) => setCmsSubtitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Description of academy achievements and features..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Hero Featured Image (URL or Base64)</label>
                    <input
                      type="text"
                      value={cmsHeroImage}
                      onChange={(e) => setCmsHeroImage(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
                      placeholder="https://images.unsplash.com/..."
                    />
                    
                    <div className="flex items-center gap-2">
                      <label className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-extrabold px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1">
                        <Image className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload Custom Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setCmsHeroImage(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {cmsHeroImage && (
                        <span className="text-[10px] text-emerald-600 font-bold">✓ Image attached</span>
                      )}
                    </div>

                    {cmsHeroImage && (
                      <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 max-h-36">
                        <img src={cmsHeroImage} alt="Hero Preview" className="w-full h-36 object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Buttons & Contact Details */}
                <div className="space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-950 font-display flex items-center gap-1.5">
                    <Settings2 className="w-4 h-4 text-indigo-600" />
                    CTA Buttons & Contact Info
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Primary CTA Button Text</label>
                      <input
                        type="text"
                        value={cmsPrimaryCta}
                        onChange={(e) => setCmsPrimaryCta(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Book Free Live Demo Class"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Secondary CTA Button Text</label>
                      <input
                        type="text"
                        value={cmsSecondaryCta}
                        onChange={(e) => setCmsSecondaryCta(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Try Live Speed Drills"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Public Contact Phone</label>
                      <input
                        type="text"
                        value={cmsContactPhone}
                        onChange={(e) => setCmsContactPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Public Contact Email</label>
                      <input
                        type="email"
                        value={cmsContactEmail}
                        onChange={(e) => setCmsContactEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="support@abacusgenius.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Headquarters / Academy Address</label>
                    <input
                      type="text"
                      value={cmsAddress}
                      onChange={(e) => setCmsAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Genius Towers, Tech City, India"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Footer Brand Title</label>
                      <input
                        type="text"
                        value={cmsFooterTitle}
                        onChange={(e) => setCmsFooterTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Abacus Genius Academy"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Footer Description</label>
                      <input
                        type="text"
                        value={cmsFooterDesc}
                        onChange={(e) => setCmsFooterDesc(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Empowering mental math champions"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={cmsSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider px-8 py-3 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>{cmsSaving ? "Publishing Updates..." : "Publish Landing Page Content"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Teacher LMS Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto text-left">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                {editingCourse ? "Edit Teacher LMS Course" : "Create New Teacher LMS Course"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Level 1 Abacus Pedagogy & Finger Methods"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Category (Manual Text)</label>
                  <input
                    type="text"
                    required
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    placeholder="e.g. Pedagogy & Finger Methods, Parent Counseling, Fee Structure..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none mb-1.5"
                  />
                  <div className="flex flex-wrap gap-1">
                    {["Pedagogy & Finger Methods", "Parent Counseling", "Fee Structure", "Marketing & Growth", "General Skill"].map(cat => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setCourseCategory(cat)}
                        className="text-[9px] font-bold bg-slate-100 hover:bg-indigo-100 hover:text-indigo-900 text-slate-700 px-2 py-0.5 rounded-lg cursor-pointer transition-all"
                      >
                        + {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Target Level / Skill Track</label>
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={0}>General / All Levels / Non-Abacus Track</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                      <option key={lvl} value={lvl}>Abacus Level {lvl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    min={1}
                    value={courseDurationHours}
                    onChange={(e) => setCourseDurationHours(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={courseIsPublished ? "published" : "draft"}
                    onChange={(e) => setCourseIsPublished(e.target.value === "published")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="published">Published (Visible to Teachers)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Course Overview & Learning Outcomes</label>
                <textarea
                  rows={2}
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Describe teaching methodologies, finger posture rules, and classroom activities covered..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* CURRICULUM MODULES & LESSONS STUDIO */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 font-display flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Course Units & Lessons Studio ({courseModules.length} Units)
                    </h4>
                    <p className="text-[10px] text-slate-500">Build video modules, teaching manuals, guides & quizzes for teacher certification.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-black text-xs px-3 py-1.5 rounded-xl border border-indigo-200 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>+ Add Unit</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {courseModules.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-400 font-medium">
                      No units added yet. Click "+ Add Unit" above to start building pedagogy lessons.
                    </div>
                  ) : (
                    courseModules.map((mod, modIdx) => (
                      <div key={mod.id || modIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md">
                              Unit {modIdx + 1}
                            </span>
                            <span className="font-extrabold text-xs text-slate-900">{mod.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenLessonModal(mod.id)}
                              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>+ Add Lesson</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteModule(mod.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                              title="Delete Module"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Lessons List in Module */}
                        <div className="space-y-1.5 pl-2 border-l-2 border-indigo-200">
                          {(!mod.lessons || mod.lessons.length === 0) ? (
                            <p className="text-[10px] text-slate-400 italic">No lessons in this unit yet. Click "+ Add Lesson".</p>
                          ) : (
                            mod.lessons.map((les, lIdx) => (
                              <div key={les.id || lIdx} className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  {les.type === "video" && <Play className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                                  {les.type === "manual_pdf" && <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                  {les.type === "quiz" && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                  {(les.type === "guide" || les.type === "lesson_plan") && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                  <div>
                                    <div className="font-bold text-slate-900 text-[11px]">{les.title}</div>
                                    <div className="text-[9px] text-slate-400 uppercase font-semibold">
                                      {les.type} • {les.durationMinutes || 15} mins
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenLessonModal(mod.id, les)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                    title="Edit Lesson"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLesson(mod.id, les.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                    title="Delete Lesson"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCourse}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {isSavingCourse ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  <span>{editingCourse ? "Update Course" : "Save Course"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Create / Edit LMS Lesson */}
      {showAddLessonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto text-left">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {editingLessonId ? "Edit Lesson Content" : "Add New Pedagogy Lesson"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddLessonModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g. Finger Movement Rules for +5 Combination Formula"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Lesson Type</label>
                  <select
                    value={lessonType}
                    onChange={(e: any) => setLessonType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="video">🎥 Video Demonstration</option>
                    <option value="manual_pdf">📄 Manual / PDF Guide</option>
                    <option value="guide">💡 Pedagogy Guide</option>
                    <option value="lesson_plan">📅 Lesson Plan</option>
                    <option value="quiz">📝 Certification Quiz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {lessonType !== "quiz" && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Media / PDF Embed URL</label>
                  <input
                    type="url"
                    value={lessonUrl}
                    onChange={(e) => setLessonUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/... or PDF URL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Teaching Notes & Step-by-Step Instructions</label>
                <textarea
                  rows={3}
                  value={lessonText}
                  onChange={(e) => setLessonText(e.target.value)}
                  placeholder="Enter detailed pedagogy instructions, formula steps (+5 = +10 - 5), and teacher practice guidelines..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {lessonType === "quiz" && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-amber-900 uppercase">Quiz Questions ({quizQuestions.length})</label>
                    <button
                      type="button"
                      onClick={() => setQuizQuestions([...quizQuestions, { question: "New Question...", options: ["Option A", "Option B", "Option C", "Option D"], correctIndex: 0 }])}
                      className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 cursor-pointer"
                    >
                      + Add Question
                    </button>
                  </div>

                  {quizQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-800">Q{qIdx + 1}:</span>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...quizQuestions];
                            updated[qIdx].question = e.target.value;
                            setQuizQuestions(updated);
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setQuizQuestions(quizQuestions.filter((_, idx) => idx !== qIdx))}
                          className="text-rose-600 font-bold px-1"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-1">
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correctIndex === oIdx}
                              onChange={() => {
                                const updated = [...quizQuestions];
                                updated[qIdx].correctIndex = oIdx;
                                setQuizQuestions(updated);
                              }}
                              title="Set as correct answer"
                              className="accent-emerald-600"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...quizQuestions];
                                updated[qIdx].options[oIdx] = e.target.value;
                                setQuizQuestions(updated);
                              }}
                              className="w-full bg-white border border-slate-200 rounded p-1 text-[11px]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLessonModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider px-5 py-2 rounded-xl shadow-md cursor-pointer"
                >
                  Save Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Interactive LMS Preview Modal */}
      {selectedCoursePreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto text-left">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                  {selectedCoursePreview.category}
                </span>
                <h3 className="text-xl font-black text-slate-900 font-display mt-2">
                  {selectedCoursePreview.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {selectedCoursePreview.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCoursePreview(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modules and Lessons list */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Course Curriculum & Lesson Breakdown ({selectedCoursePreview.modules?.length || 0} Modules)
              </h4>

              {(!selectedCoursePreview.modules || selectedCoursePreview.modules.length === 0) ? (
                <div className="bg-slate-50 p-6 rounded-2xl text-center text-xs text-slate-400">
                  No modules created yet for this course. Click Edit to add units.
                </div>
              ) : (
                selectedCoursePreview.modules.map((mod, idx) => (
                  <div key={mod.id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-extrabold text-slate-900 font-display">
                        {mod.title}
                      </h5>
                      <span className="text-[10px] font-black bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg">
                        Unit {idx + 1}
                      </span>
                    </div>

                    {mod.description && (
                      <p className="text-xs text-slate-600 font-medium">{mod.description}</p>
                    )}

                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      {mod.lessons?.map((les, lIdx) => (
                        <div key={les.id || lIdx} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                              {les.type === "video" && <Play className="w-3.5 h-3.5 text-rose-500" />}
                              {les.type === "manual_pdf" && <BookOpen className="w-3.5 h-3.5 text-indigo-600" />}
                              {les.type === "quiz" && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                              {les.title}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {les.type}
                            </span>
                          </div>

                          {les.textContent && (
                            <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                              {les.textContent}
                            </p>
                          )}

                          {les.contentUrl && les.type === "video" && (
                            <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center text-white text-xs">
                              <iframe
                                src={les.contentUrl}
                                title={les.title}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          )}

                          {les.quizQuestions && les.quizQuestions.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 text-xs">
                              <div className="font-extrabold text-amber-900 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                Assessment Quiz Sample ({les.quizQuestions.length} Questions)
                              </div>
                              {les.quizQuestions.map((q, qIdx) => (
                                <div key={qIdx} className="bg-white p-2.5 rounded-lg border border-amber-200 space-y-1">
                                  <div className="font-bold text-slate-900">Q{qIdx + 1}: {q.question}</div>
                                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className={`px-2 py-1 rounded ${oIdx === q.correctIndex ? "bg-emerald-100 text-emerald-900 font-bold" : "bg-slate-50"}`}>
                                        {opt} {oIdx === q.correctIndex && "✓"}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCoursePreview(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Close LMS Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function PlanFeeEditorCard({ plan, onUpdate }: { key?: any; plan: any; onUpdate?: (id: string, fee: number) => void }) {
  const [feeInput, setFeeInput] = useState(plan.monthlyFee);
  const [success, setSuccess] = useState(false);

  // Sync state if plan monthly fee changes
  React.useEffect(() => {
    setFeeInput(plan.monthlyFee);
  }, [plan.monthlyFee]);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
      <div>
        <h4 className="font-extrabold text-sm text-slate-900 font-display">{plan.name}</h4>
        <p className="text-[11px] text-slate-500 mt-1">
          Used by center admins to classify standard billing tiers.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-slate-500 uppercase">Monthly Fee (₹)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={feeInput}
            onChange={(e) => setFeeInput(Number(e.target.value))}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => {
              if (onUpdate) {
                onUpdate(plan.id, feeInput);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 2000);
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            Assign Rate
          </button>
        </div>
        {success && (
          <p className="text-[10px] text-emerald-600 font-bold animate-pulse">✓ Fee rate updated successfully!</p>
        )}
      </div>
    </div>
  );
}
