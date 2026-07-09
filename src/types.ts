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
}

export interface Teacher {
  id: string;
  centerId: string;
  name: string;
  email: string;
  mobile: string;
  joiningDate: string;
  role: string;
  status: string;
  password?: string;
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
  batch: string;
  joiningDate: string;
  status: string;
  email?: string;
  password?: string;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    date: string;
    read: boolean;
  }>;
}

export interface CRMLead {
  id: string;
  centerId: string;
  name: string;
  parentName: string;
  parentMobile: string;
  source: string;
  campaign: string;
  counsellor: string;
  status: string; // "New Lead" | "Contacted" | "Demo Scheduled" | "Demo Attended" | "Follow-up" | "Admission Confirmed" | "Lost"
  date: string;
  remarks: string;
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
}

export interface AcademyLeaderboardEntry {
  id: string;
  studentId: string;
  studentName: string;
  stars: number;
  level: number;
  completedCount: number;
}

export interface ConceptWorksheet {
  id: string;
  title: string;
  level: number;
  conceptName: string;
  sums: { expression: string; answer: number; rows?: number[] }[];
  createdByTeacherId?: string;
  createdByTeacherName?: string;
  centerId?: string;
  createdAt?: string;
}

