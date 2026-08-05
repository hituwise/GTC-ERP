export interface Center {
  id: string;
  name: string;
  ownerName: string;
  mobile: string;
  email: string;
  city: string;
  state: string;
  country: string;
  plan: string;
  subscriptionStart: string;
  subscriptionExpiry: string;
  status: string;
  password?: string;
  trialDays?: number;
  trialExpiryDate?: string;
  isTrial?: boolean;
  upiId?: string;
  bankDetails?: string;
  qrCode?: string;
  customPrice?: number;
  addresses?: string[];
  planType?: string;
  studentLimit?: number;
  teacherLimit?: number;
  staffLimit?: number;
  centerLimit?: number;
  isSuperCenter?: boolean;
  parentCenterId?: string;
  monthlyPrice?: number;
  logo?: string;
  signatureUrl?: string;
  signature?: string;
  signatureTitle?: string;
  stampUrl?: string;
  isoLogoUrl?: string;
  isoText?: string;
  msmeRegNumber?: string;
  certificateTheme?: "gold" | "indigo" | "emerald" | "crimson" | "dark" | "rosegold" | "classic";
  certificatePrimaryColor?: string;
  certificateAccentColor?: string;
  certificateBorderStyle?: "double-gold" | "ornate" | "modern-clean" | "royal-frame";
  hideScoreOnCertificate?: boolean;
  alsoWorksAsTeacher?: boolean;
  monthlySubscriptionAmount?: number;
  billingDate?: number; // 1-31
  nextRenewalDate?: string; // YYYY-MM-DD
  subscriptionStatus?: "Active" | "Expired" | "Suspended";
  lastSelectedWeek?: string; // YYYY-MM-DD of Monday for student of the week
  lastSelectedMonth?: string; // YYYY-MM of the student of the month
  notificationEmail?: string;
  senderEmail?: string;
  ccEmails?: string;
  emailNotificationsEnabled?: boolean;
  emailNotifyNewLead?: boolean;
  emailNotifyFeeReceipt?: boolean;
  emailNotifyStudentAttendance?: boolean;
  emailNotifyHomeworkSubmitted?: boolean;
  emailNotifyTeacherSubmissions?: boolean;
  emailNotifySystemUpdates?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  roleNotificationPreferences?: RoleNotificationPreferences;
}

export interface RoleNotificationPreferences {
  superAdmin?: {
    subscriptionInvoice?: boolean;
    subscriptionPaymentReceived?: boolean;
    subscriptionPaymentPending?: boolean;
    subscriptionExpiringSoon?: boolean;
    subscriptionExpired?: boolean;
    studentQuotaWarning?: boolean;
  };
  centerAdmin?: {
    newLead?: boolean;
    newStudentRegistration?: boolean;
    studentFeePaid?: boolean;
    newInvoiceGenerated?: boolean;
    paymentPending?: boolean;
    paymentOverdue?: boolean;
    examPrepStage?: boolean; // Week 10
    teacherActivities?: boolean;
    crmFollowups?: boolean;
  };
  manager?: {
    enabled?: boolean;
    newLeads?: boolean;
    studentRegistrations?: boolean;
    feeCollection?: boolean;
    attendanceSummary?: boolean;
    homeworkSummary?: boolean;
    todaysFollowups?: boolean;
    demoBookings?: boolean;
    teacherActivities?: boolean;
  };
  marketingSales?: {
    enabled?: boolean;
    newLeadAssigned?: boolean;
    todaysFollowup?: boolean;
    demoScheduled?: boolean;
    demoRescheduled?: boolean;
    parentCallbackRequested?: boolean;
    leadStatusChanged?: boolean;
    whatsAppReply?: boolean;
    missedFollowup?: boolean;
  };
  teacher?: {
    morningDigest?: boolean;
    examPrepAlert?: boolean;
    homeworkToReview?: boolean;
  };
  parentStudent?: {
    registrationConfirmation?: boolean;
    feeReceipt?: boolean;
    invoice?: boolean;
    paymentReminder?: boolean;
    homeworkAssigned?: boolean;
    examSchedule?: boolean;
    examResult?: boolean;
    certificateReady?: boolean;
    competitionRegistration?: boolean;
    competitionResult?: boolean;
    materialDispatched?: boolean;
    materialDelivered?: boolean;
  };
}

export interface Teacher {
  id: string;
  centerId: string;
  centerIds?: string[]; // Multiple center/branch IDs assigned to teach
  name: string;
  email: string;
  mobile: string;
  joiningDate: string;
  role: string;
  status: string;
  password?: string;
  rating?: number;
  ratingCount?: number;
  ratingSum?: number;
  permitLeadAccess?: boolean;
  emailNotificationsEnabled?: boolean;
  notifications?: any[];
  monthlySalary?: number;
  availableSlots?: string[];
  signatureUrl?: string;
  signature?: string;
}

export interface Student {
  id: string;
  centerId: string;
  teacherId: string;
  studentName: string;
  parentName: string;
  parentMobile: string;
  dateOfBirth: string;
  age: number;
  school: string;
  currentLevel: number;
  startingWeek?: number;
  levelStartDate?: string;
  batch: string;
  joiningDate: string;
  status: string;
  email?: string;
  password?: string;
  avatar?: string;
  photo?: string;
  rating?: number;
  badges?: string[];
  isStudentOfWeek?: boolean;
  isStudentOfMonth?: boolean;
  studentOfWeekReason?: string;
  studentOfMonthReason?: string;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    date: string;
    read: boolean;
  }>;
  hideAbacusPreference?: boolean;
  feePlan?: string;
  billingType?: "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly" | "Custom";
  monthlyFee?: number;
  billingDate?: number; // Day of month 1-31
  gender?: "Male" | "Female" | "Other";
  fatherName?: string;
  fatherMobile?: string;
  motherName?: string;
  motherMobile?: string;
  primaryContact?: "Father" | "Mother";
  primaryNotificationNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  enableWhatsApp?: boolean;
  stars?: number; // Fail-safe backup for student stars
  enableLogin?: boolean;
  courseId?: string;
  courseName?: string;
  batchCode?: string;
}

export interface CRMLead {
  id: string;
  leadNumber?: string;
  centerId: string;
  sharedCenterIds?: string[]; // Branch/sub-center IDs this lead is shared with
  name: string;
  parentName: string;
  parentMobile: string;
  email?: string;
  source: string;
  campaign: string;
  counsellor: string;
  status: string; // "New Lead" | "Demo Booked" | "Demo Done" | "Enrolled" | "Lost"
  date: string;
  remarks: string;
  entries?: Array<{ id: string; date: string; time?: string; source: string; campaign?: string; remarks: string; }>;
  followupDate?: string;
  followupTime?: string;
  demoRescheduleDate?: string;
  demoRescheduleTime?: string;
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  calls?: Array<{ id: string; timestamp: string; staffName: string; note: string; connected?: boolean; }>;
  connectionsCount?: number;
  attendedDemo?: boolean;
  openedWhatsApp?: boolean;
  askedFees?: boolean;
  missedCallsCount?: number;
  registrationCount?: number;
  registrationIndex?: number;
}

export interface AttendanceRecord {
  studentId: string;
  date: string;
  status: "Present" | "Absent";
  level: number;
  batch: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  centerId: string;
  month: string;
  amount: number;
  status: "Paid" | "Unpaid" | "Pending Approval";
  paidDate: string;
  discount: number;
  feeType?: string; // "Registration" | "Level Fee" | "Exam Fee" | "Competition" | "Extra Curricular"
  proofScreenshot?: string;
  proofSubmittedDate?: string;
  referenceNumber?: string;
  paymentMethod?: string;
  feedback?: string;
  dueDate?: string; // YYYY-MM-DD
  isAutomated?: boolean;
  sentReminders?: string[];
}

export interface FeeStructure {
  centerId: string;
  registrationFee: number;
  levelFee: number; // level tuition fee
  examFee: number;
  extraFees: { id: string; name: string; amount: number }[];
}

export interface ExpenseRecord {
  id: string;
  centerId: string;
  category: "Rent" | "Salary" | "Marketing" | "Utilities" | "Miscellaneous";
  amount: number;
  date: string;
  description: string;
}

export interface HomeworkRecord {
  id: string;
  studentId: string;
  week: string;
  task: string;
  status: "Completed" | "Incomplete";
  score: string;
  submissionDate?: string;
  submissionTime?: string;
  submittedProof?: string;
  notes?: string;
  feedback?: string;
  batch?: string;
}

export interface ExamRecord {
  id: string;
  studentId: string;
  examName: string;
  date: string;
  score: number;
  maxScore: number;
  certificate: string;
  feedback: string;
}

export interface StudentPracticeAssignment {
  id: string;
  studentId: string;
  title: string;
  sumsCount: number;
  completedCount: number;
  level: number;
  dueDate: string;
  teacherFocus: string;
  digits: number;
  rows: number;
  type: "Addition" | "Subtraction" | "Multiplication" | "Division";
  starsEarned: number;
  customSums?: { expression: string; answer: number; rows?: number[] }[];
  disableAbacus?: boolean;
}

export interface StudentPracticeSubmission {
  id: string;
  studentId: string;
  studentName: string;
  assignmentId: string;
  assignmentTitle: string;
  date: string;
  type: "Addition" | "Subtraction" | "Multiplication" | "Division";
  totalSums: number;
  correctSums: number;
  accuracy: number;
  starsEarned: number;
  mode: "Assigned" | "Self-Practice";
  timeTakenSeconds?: number;
}

export interface AcademyLeaderboardEntry {
  id: string;
  studentId: string;
  studentName: string;
  stars: number;
  level: number;
  completedCount: number;
}

export interface ExamQuestionItem {
  id?: string;
  questionType?: "Abacus Sum" | "Multiplication" | "Division" | "Percentage" | "HCF_LCM" | "MCQ" | "Short Answer";
  expression: string;
  answer: number | string;
  rows?: number[];
  options?: string[];
}

export interface ConceptWorksheet {
  id: string;
  title: string;
  level: number;
  conceptName: string;
  sums: ExamQuestionItem[];
  createdByTeacherId?: string;
  createdByTeacherName?: string;
  centerId?: string;
  createdAt?: string;
}

export interface ExamDefinition {
  id: string;
  centerId: string;
  centerName?: string;
  teacherId: string;
  teacherName: string;
  title: string;
  level: number;
  durationMinutes: number;
  passingScore: number; // e.g. 70 (%)
  totalMarks: number;
  questions: ExamQuestionItem[];
  status: "Published" | "Draft" | "Archived";
  createdAt: string;
}

export interface Competition {
  id: string;
  centerId: string;
  centerName: string;
  title: string;
  category: "Abacus Speed" | "Mental Math" | "Rubik Cube" | "Vedic Maths" | "Art / Extra-Curricular" | "General Skill";
  eventDate: string;
  description: string;
  entryFee: number;
  rules: string;
  status: "Upcoming" | "Active" | "Completed";
  bannerUrl?: string;
  participants: Array<{
    id: string;
    studentName: string;
    parentName: string;
    parentMobile: string;
    parentEmail?: string;
    isExternalGuest: boolean;
    centerId?: string;
    score?: number;
    accuracy?: number;
    rank?: number;
    timeTakenSeconds?: number;
    certificateIssued?: boolean;
    completedAt?: string;
  }>;
  createdAt: string;
}

export interface CertificateRecord {
  id: string;
  centerId: string;
  centerName: string;
  studentId: string;
  studentName: string;
  title: string;
  certificateType: "Level Exam" | "Competition" | "Merit Award";
  level?: number;
  score?: number;
  issueDate: string;
  logoUrl?: string;
  signatureUrl?: string;
  certificateNumber: string;
  status: "Approved" | "Pending Approval";
  approvedBy?: string;
  signatoryTitle?: string;
  includeTeacherSignature?: boolean;
  teacherName?: string;
  teacherSignatureUrl?: string;
  isoLogoUrl?: string;
  isoText?: string;
  msmeRegNumber?: string;
  themeStyle?: "gold" | "indigo" | "emerald" | "crimson" | "dark" | "rosegold" | "classic";
  primaryColor?: string;
  accentColor?: string;
  borderStyle?: "double-gold" | "ornate" | "modern-clean" | "royal-frame";
  hideScore?: boolean;
}

export interface AccountingIncome {
  id: string;
  centerId: string;
  date: string; // YYYY-MM-DD
  studentName: string; // Student / Customer Name
  category: "Registration Fee" | "Course Fee" | "Exam Fee" | "Material Fee" | "Competition Fee" | "Workshop Fee" | "Franchise Fee" | "Subscription Income" | "Other Income";
  amount: number;
  paymentMode: "Cash" | "UPI" | "Bank Transfer" | "Card" | "Cheque";
  receiptNumber: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface AccountingExpense {
  id: string;
  centerId: string;
  date: string; // YYYY-MM-DD
  category: "Marketing" | "Meta Ads" | "Google Ads" | "Teacher Salary" | "Staff Salary" | "Rent" | "Electricity" | "Internet" | "Software Subscription" | "Books" | "Abacus Material" | "Courier Charges" | "Competition Expenses" | "Travel" | "Office Supplies" | "Other Expenses";
  vendorName: string;
  amount: number;
  paymentMode: "Cash" | "UPI" | "Bank Transfer" | "Card" | "Cheque";
  invoiceNumber: string;
  notes: string;
  attachmentUrl?: string; // Base64 representation of receipt image or file
  frequency?: "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly" | "One-time payment";
  createdBy: string;
  createdAt: string;
}

export interface AccountingRecurring {
  id: string;
  centerId: string;
  type: "Income" | "Expense";
  category: string; // Dynamic based on type
  name: string; // e.g. "Office Rent", "Teacher Salary", "CRM Subscription"
  amount: number;
  interval: "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly";
  startDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  notes: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface AccountingAuditTrail {
  id: string;
  centerId: string;
  userEmail: string;
  userName: string;
  action: "Create" | "Edit" | "Delete" | "Trigger Reminder" | "Trigger Testing";
  entityType: "Income" | "Expense" | "Recurring" | "Testing";
  entityId: string;
  timestamp: string; // ISO String
  details: string; // Human readable description
}

export interface TeacherTrainee {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city?: string;
  state?: string;
  enrollmentDate: string;
  enrollmentType?: "recorded_course" | "live_batch";
  assignedBatch?: string; // e.g. "Batch 001"
  status: "Enrolled" | "In-Training" | "Exam Pending" | "Certified Teacher" | "Active Practice" | "30-Day CRM Trial Active" | "Inactive";
  paymentStatus?: "Paid" | "Partial" | "Pending" | "Free Trial";
  currentTrainingLevel: number; // 0 to 8
  studentPortalAccess: boolean; // Gives trainee access to student practice, speed drills & exam simulator
  trialActivated: boolean;
  trialCenterId?: string;
  trialCenterName?: string;
  trialStartDate?: string;
  trialEndsAt?: string;
  assignedCourses?: string[];
  assignedModules?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherCourseLesson {
  id: string;
  title: string;
  description?: string;
  type: "video" | "manual_pdf" | "guide" | "lesson_plan" | "quiz";
  contentUrl?: string;
  url?: string;
  textContent?: string;
  durationMinutes?: number;
  quizQuestions?: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
}

export interface TeacherCourseModule {
  id: string;
  title: string;
  description?: string;
  level: number; // 0 to 8
  lessons: TeacherCourseLesson[];
}

export interface TeacherCourse {
  id: string;
  title: string;
  level: number; // 0 to 8
  category: "Pedagogy & Finger Methods" | "Anzan Speed Math" | "Classroom Management" | "Exam & Certification Prep" | "Level Guide" | "Parent Counseling" | "Fee Structure & Finance" | "Curriculum Planning" | "Marketing & Growth" | "Bonus Course";
  courseCategoryType?: "abacus_teacher_training" | "parent_counseling" | "fee_structure" | "curriculum" | "marketing" | "bonus_course";
  courseDeliveryType?: "recorded_course" | "live_batch";
  assignedBatchCode?: string; // e.g. "Batch 001"
  instructorName?: string;
  priceINR?: number; // Value of course
  isBonusCourse?: boolean;
  description: string;
  thumbnailUrl?: string;
  durationHours?: number;
  isPublished: boolean;
  modules: TeacherCourseModule[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherLiveBatch {
  id: string;
  batchCode: string; // e.g. "Batch 001"
  title: string;
  instructorName: string;
  startDate: string;
  endDate: string;
  scheduleTime: string; // e.g. "Mon & Wed 10:00 AM - 11:30 AM"
  meetUrl?: string; // Zoom or Google Meet Link
  notes?: string;
  assignedCourseIds?: string[];
  assignedMaterialUrls?: { title: string; url: string; type: string }[];
  enrolledTraineeIds?: string[];
  status: "Upcoming" | "Active" | "Completed";
  createdAt: string;
}


