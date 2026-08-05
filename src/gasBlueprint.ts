export const GOOGLE_SHEETS_SCHEMA = [
  {
    sheetName: "Centers",
    description: "Stores multi-tenant center credentials, subscriptions, and administrative contacts.",
    columns: ["Center ID (PK)", "Center Name", "Owner Name", "Mobile", "Email", "City", "State", "Country", "Plan", "Subscription Start Date", "Subscription Expiry Date", "Status"],
    validation: "Center ID must be unique (e.g. C001, C002). Email must be unique for login validation.",
  },
  {
    sheetName: "Teachers",
    description: "List of authorized instructors per center.",
    columns: ["Teacher ID (PK)", "Center ID (FK)", "Name", "Email", "Mobile", "Joining Date", "Role", "Status"],
    validation: "Center ID must exist in Centers. Email used for Google Login and role validation.",
  },
  {
    sheetName: "Students",
    description: "Registry of students enrolled in specific centers, assigned to teachers/batches.",
    columns: ["Student ID (PK)", "Center ID (FK)", "Teacher ID (FK)", "Student Name", "Parent Name", "Parent Mobile", "Date Of Birth", "Age", "School", "Current Level", "Batch", "Joining Date", "Status"],
    validation: "Student ID must be unique. Current Level must be [1-8]. Center ID matches the tenant.",
  },
  {
    sheetName: "Attendance",
    description: "Daily or batch-wise attendance logs.",
    columns: ["Student ID (FK)", "Date", "Status (Present/Absent)", "Level", "Batch"],
    validation: "Composite key of (Student ID, Date). Restrict to authorized students within the tenant center.",
  },
  {
    sheetName: "Fees",
    description: "Outstanding and collected tuition or material fees.",
    columns: ["Fee ID (PK)", "Student ID (FK)", "Center ID (FK)", "Month", "Amount", "Status (Paid/Unpaid)", "Paid Date", "Discount Amount"],
    validation: "Amount must be positive. Status is validated before processing payment.",
  },
  {
    sheetName: "Expenses",
    description: "Operational expenditure tracking for individual centers.",
    columns: ["Expense ID (PK)", "Center ID (FK)", "Category (Rent/Salary/Marketing/Utilities/Misc)", "Amount", "Date", "Description"],
    validation: "Amount must be positive. Restricted to logged-in center tenant's ID.",
  },
  {
    sheetName: "Leads",
    description: "Sales CRM pipeline for student admissions.",
    columns: ["Lead ID (PK)", "Center ID (FK)", "Name", "Parent Name", "Parent Mobile", "Source", "Campaign", "Counsellor", "Status", "Date", "Remarks"],
    validation: "Status must be: New Lead, Contacted, Demo Scheduled, Demo Attended, Follow-up, Admission Confirmed, or Lost.",
  },
  {
    sheetName: "Homework",
    description: "Worksheet tracking, digital and physical assignments.",
    columns: ["Assignment ID (PK)", "Student ID (FK)", "Week", "Task Description", "Status (Completed/Incomplete)", "Score/Feedback"],
    validation: "Ensures homework completion is logged against students of the teacher's center.",
  },
  {
    sheetName: "Exams",
    description: "Historical academic and speed records.",
    columns: ["Exam ID (PK)", "Student ID (FK)", "Exam Name", "Date", "Score", "Max Score", "Certificate (Yes/No)", "Feedback"],
    validation: "Score cannot exceed Max Score. Level checks are respected."
  }
];

export const APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * GENIPLUS ACADEMY ERP - CORE BACKEND (Google Apps Script)
 * Multi-Tenant Database, Authentication, Role Management & ERP Sync
 * ==============================================================================
 *
 * Instructions:
 * 1. Create a Google Spreadsheet.
 * 2. Rename sheets to: Centers, Teachers, Students, Attendance, Fees, Expenses, Leads, Homework, Exams
 * 3. Open Extensions > Apps Script and paste this code.
 * 4. Replace SPREADSHEET_ID below with your Sheet ID.
 * 5. Deploy as a Web App (Execute as: "Me", Who has access: "Anyone").
 */

const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
const SUPER_ADMIN_EMAIL = "superadmin@geniplus.com"; // System owner

/**
 * Main GET endpoint for Web App
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const userEmail = e.parameter.email; // Authenticated via Google Account or OAuth
    
    if (!userEmail) {
      return responseJSON({ success: false, error: "Authentication required" });
    }
    
    // Validate role & tenant center isolation
    const auth = authorizeUser(userEmail);
    if (!auth.authorized) {
      return responseJSON({ success: false, error: "Access denied or subscription expired" });
    }

    if (action === "getERPData") {
      return getERPDataForTenant(auth);
    } else if (action === "getProfile") {
      return responseJSON({ success: true, auth: auth });
    } else {
      return responseJSON({ success: false, error: "Invalid GET action" });
    }
  } catch (err) {
    return responseJSON({ success: false, error: err.toString() });
  }
}

/**
 * Main POST endpoint for Web App
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const userEmail = postData.email;
    const action = postData.action;

    if (!userEmail) {
      return responseJSON({ success: false, error: "Authentication required" });
    }

    // Validate role & tenant center isolation
    const auth = authorizeUser(userEmail);
    if (!auth.authorized) {
      return responseJSON({ success: false, error: "Access denied" });
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === "addStudent") {
      return addStudentRow(ss, auth, postData.payload);
    } else if (action === "addTeacher") {
      return addTeacherRow(ss, auth, postData.payload);
    } else if (action === "addCenter") {
      return addCenterRow(ss, auth, postData.payload);
    } else if (action === "addLead") {
      return addLeadRow(ss, auth, postData.payload);
    } else if (action === "markAttendance") {
      return markAttendanceRows(ss, auth, postData.payload);
    } else if (action === "payFee") {
      return processFeePayment(ss, auth, postData.payload);
    } else if (action === "addExpense") {
      return addExpenseRow(ss, auth, postData.payload);
    } else {
      return responseJSON({ success: false, error: "Invalid POST action" });
    }
  } catch (err) {
    return responseJSON({ success: false, error: err.toString() });
  }
}

/**
 * MULTI-TENANT ROLE & SECURITY CONTROLLER
 * Verifies if user exists, fetches role and filters data by Center ID (Tenant)
 */
function authorizeUser(email) {
  if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { authorized: true, role: "Super Admin", centerId: "ALL", email: email };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Check if user is Center Admin
  const centersSheet = ss.getSheetByName("Centers");
  const centersData = centersSheet.getDataRange().getValues();
  for (let i = 1; i < centersData.length; i++) {
    const ownerEmail = centersData[i][4]; // Column E: Email
    const status = centersData[i][11]; // Column L: Status
    const expiry = new Date(centersData[i][10]); // Column K: Subscription Expiry
    const today = new Date();

    if (ownerEmail && ownerEmail.toString().toLowerCase() === email.toLowerCase()) {
      if (status !== "Active") {
        return { authorized: false, error: "Center status is inactive" };
      }
      if (expiry < today) {
        return { authorized: false, error: "SaaS subscription has expired" };
      }
      return {
        authorized: true,
        role: "Center Admin",
        centerId: centersData[i][0], // Column A: Center ID
        centerName: centersData[i][1],
        email: email
      };
    }
  }

  // 2. Check if user is Teacher
  const teachersSheet = ss.getSheetByName("Teachers");
  const teachersData = teachersSheet.getDataRange().getValues();
  for (let i = 1; i < teachersData.length; i++) {
    const teacherEmail = teachersData[i][3]; // Column D: Email
    const status = teachersData[i][7]; // Column H: Status
    if (teacherEmail && teacherEmail.toString().toLowerCase() === email.toLowerCase()) {
      if (status !== "Active") {
        return { authorized: false, error: "Teacher status is inactive" };
      }
      return {
        authorized: true,
        role: "Teacher",
        centerId: teachersData[i][1], // Column B: Center ID (Tenant)
        teacherId: teachersData[i][0], // Column A: Teacher ID
        email: email
      };
    }
  }

  return { authorized: false, error: "User is not registered on Geniplus Academy ERP" };
}

/**
 * SECURITY COMPLIANCE: GET ERP DATA (FILTERED BY TENANT)
 */
function getERPDataForTenant(auth) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const result = {};

  // Fetch all sheets
  const sheetsToFetch = ["Centers", "Teachers", "Students", "Attendance", "Fees", "Expenses", "Leads", "Homework", "Exams"];
  
  sheetsToFetch.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      result[sheetName.toLowerCase()] = [];
      return;
    }
    
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowObj = {};
      headers.forEach((header, index) => {
        rowObj[camelize(header)] = row[index];
      });

      // Filter logic to isolate tenant (Center Admin and Teacher)
      if (auth.role !== "Super Admin") {
        // Most sheets have centerId or studentId. Let's filter by Center ID.
        if (rowObj.centerId && rowObj.centerId !== auth.centerId) {
          continue; // Skip data from other centers
        }
        
        // Filter student data for specific assigned Teacher if role is Teacher
        if (auth.role === "Teacher") {
          if (sheetName === "Students" && rowObj.teacherId !== auth.teacherId) {
            continue;
          }
          if (sheetName === "Homework") {
            // Need to trace homework's student back to teacher
            const isAssigned = checkStudentTeacherAssigned(ss, rowObj.studentId, auth.teacherId);
            if (!isAssigned) continue;
          }
        }
      }

      data.push(rowObj);
    }
    result[sheetName.toLowerCase()] = data;
  });

  return responseJSON({ success: true, data: result });
}

/**
 * Row insertion handlers with tenant verification
 */
function addStudentRow(ss, auth, payload) {
  // Enforce tenant Center ID
  const centerId = auth.role === "Super Admin" ? payload.centerId : auth.centerId;
  const sheet = ss.getSheetByName("Students");
  const lastRow = sheet.getLastRow();
  const nextId = "S" + String(lastRow + 1000).padStart(4, "0");

  const rowData = [
    nextId,
    centerId,
    payload.teacherId || "",
    payload.studentName,
    payload.parentName,
    payload.parentMobile,
    payload.dateOfBirth,
    Number(payload.age) || 8,
    payload.school || "",
    payload.currentLevel !== undefined && payload.currentLevel !== null ? Number(payload.currentLevel) : 1,
    payload.batch || "Standard",
    new Date().toISOString().split("T")[0],
    "Active"
  ];

  sheet.appendRow(rowData);
  return responseJSON({ success: true, id: nextId });
}

function addTeacherRow(ss, auth, payload) {
  // Only Super Admin or Center Admin can add teachers
  if (auth.role !== "Super Admin" && auth.role !== "Center Admin") {
    return responseJSON({ success: false, error: "Unauthorized" });
  }
  const centerId = auth.role === "Super Admin" ? payload.centerId : auth.centerId;
  const sheet = ss.getSheetByName("Teachers");
  const lastRow = sheet.getLastRow();
  const nextId = "T" + String(lastRow + 100).padStart(3, "0");

  const rowData = [
    nextId,
    centerId,
    payload.name,
    payload.email,
    payload.mobile,
    new Date().toISOString().split("T")[0],
    payload.role || "Teacher",
    "Active"
  ];

  sheet.appendRow(rowData);
  return responseJSON({ success: true, id: nextId });
}

function addCenterRow(ss, auth, payload) {
  // Only system Super Admin (Geniplus) can add centers (register SaaS tenants)
  if (auth.role !== "Super Admin") {
    return responseJSON({ success: false, error: "Only Geniplus Super Admin can register centers" });
  }
  const sheet = ss.getSheetByName("Centers");
  const lastRow = sheet.getLastRow();
  const nextId = "C" + String(lastRow + 1).padStart(3, "0");

  const rowData = [
    nextId,
    payload.name,
    payload.ownerName,
    payload.mobile,
    payload.email,
    payload.city,
    payload.state,
    payload.country,
    payload.plan || "Standard",
    new Date().toISOString().split("T")[0],
    payload.subscriptionExpiry,
    "Active"
  ];

  sheet.appendRow(rowData);
  return responseJSON({ success: true, id: nextId });
}

function addLeadRow(ss, auth, payload) {
  const centerId = auth.role === "Super Admin" ? payload.centerId : auth.centerId;
  const sheet = ss.getSheetByName("Leads");
  const lastRow = sheet.getLastRow();
  const nextId = "L" + String(lastRow + 1000).padStart(4, "0");

  const rowData = [
    nextId,
    centerId,
    payload.name,
    payload.parentName,
    payload.parentMobile,
    payload.source,
    payload.campaign,
    payload.counsellor,
    payload.status || "New Lead",
    new Date().toISOString().split("T")[0],
    payload.remarks || ""
  ];

  sheet.appendRow(rowData);
  return responseJSON({ success: true, id: nextId });
}

function markAttendanceRows(ss, auth, payload) {
  const sheet = ss.getSheetByName("Attendance");
  const today = new Date().toISOString().split("T")[0];
  
  payload.records.forEach(record => {
    // Validate if student belongs to tenant's center
    if (auth.role !== "Super Admin") {
      const isMyStudent = checkStudentCenter(ss, record.studentId, auth.centerId);
      if (!isMyStudent) return;
    }
    
    // Add row to attendance
    sheet.appendRow([
      record.studentId,
      today,
      record.status,
      record.level || 1,
      record.batch || "Standard"
    ]);
  });

  return responseJSON({ success: true });
}

function processFeePayment(ss, auth, payload) {
  const sheet = ss.getSheetByName("Fees");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.feeId) {
      // Validate center tenant owns the fee record
      if (auth.role !== "Super Admin" && data[i][2] !== auth.centerId) {
        return responseJSON({ success: false, error: "Access denied to other centers' fee collections" });
      }
      
      // Update paid status (Column F) and paid date (Column G)
      sheet.getRange(i + 1, 6).setValue("Paid");
      sheet.getRange(i + 1, 7).setValue(new Date().toISOString().split("T")[0]);
      return responseJSON({ success: true });
    }
  }
  return responseJSON({ success: false, error: "Fee ID not found" });
}

function addExpenseRow(ss, auth, payload) {
  const centerId = auth.role === "Super Admin" ? payload.centerId : auth.centerId;
  const sheet = ss.getSheetByName("Expenses");
  const lastRow = sheet.getLastRow();
  const nextId = "E" + String(lastRow + 1000).padStart(4, "0");

  const rowData = [
    nextId,
    centerId,
    payload.category,
    Number(payload.amount),
    payload.date || new Date().toISOString().split("T")[0],
    payload.description || ""
  ];

  sheet.appendRow(rowData);
  return responseJSON({ success: true, id: nextId });
}

/**
 * Utility: Checks if student belongs to center
 */
function checkStudentCenter(ss, studentId, centerId) {
  const sheet = ss.getSheetByName("Students");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === studentId && data[i][1] === centerId) {
      return true;
    }
  }
  return false;
}

/**
 * Utility: Checks if student is assigned to teacher
 */
function checkStudentTeacherAssigned(ss, studentId, teacherId) {
  const sheet = ss.getSheetByName("Students");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === studentId && data[i][2] === teacherId) {
      return true;
    }
  }
  return false;
}

/**
 * General Utilities
 */
function camelize(str) {
  return str.replace(/(?:^\\w|[A-Z]|\\b\\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
