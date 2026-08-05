import React, { useState, useEffect } from "react";
import { Sparkles, Check, Phone, User, Mail, Lock, Calendar, School, GraduationCap, ArrowRight, Heart, MapPin, Eye, EyeOff, Clock } from "lucide-react";

export default function PublicStudentRegisterForm() {
  const [studentName, setStudentName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other" | "">("");

  const [fatherName, setFatherName] = useState("");
  const [fatherCountryCode, setFatherCountryCode] = useState("+91");
  const [customFatherCountryCode, setCustomFatherCountryCode] = useState("+91");
  const [fatherMobileRaw, setFatherMobileRaw] = useState("");
  const [fatherMobile, setFatherMobile] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherCountryCode, setMotherCountryCode] = useState("+91");
  const [customMotherCountryCode, setCustomMotherCountryCode] = useState("+91");
  const [motherMobileRaw, setMotherMobileRaw] = useState("");
  const [motherMobile, setMotherMobile] = useState("");

  const [primaryContact, setPrimaryContact] = useState<"Father" | "Mother" | "">("");
  const [primaryNotificationNumber, setPrimaryNotificationNumber] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [customCountry, setCustomCountry] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const params = new URLSearchParams(window.location.search);
  const selectedSlotFromUrl = params.get("selected_slot") || "";

  const [school, setSchool] = useState("");
  const [currentLevel, setCurrentLevel] = useState("1");
  const [batch, setBatch] = useState(selectedSlotFromUrl);
  const [customBatch, setCustomBatch] = useState("");
  const [isCustomTiming, setIsCustomTiming] = useState(false);
  const [personalDays, setPersonalDays] = useState("Saturday & Sunday");
  const [personalTiming, setPersonalTiming] = useState("10:00 AM - 11:00 AM");

  const [courseId, setCourseId] = useState("c_abacus");
  const [classMode, setClassMode] = useState("Batch"); // "Batch" | "Personal"
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [centerBatches, setCenterBatches] = useState<any[]>([]);

  const [branding, setBranding] = useState({
    centerName: "My Abacus Academy",
    centerLogo: "" as string | null,
    teacherName: "" as string | null
  });

  const centerId = params.get("center") || "C001";
  const teacherIdFromUrl = params.get("teacher") || "";
  const [selectedTeacherId, setSelectedTeacherId] = useState(teacherIdFromUrl);

  // Sync mobile numbers when raw inputs or country codes change
  useEffect(() => {
    const code = fatherCountryCode === "Other" ? customFatherCountryCode : fatherCountryCode;
    setFatherMobile(fatherMobileRaw ? `${code}${fatherMobileRaw}` : "");
  }, [fatherCountryCode, customFatherCountryCode, fatherMobileRaw]);

  useEffect(() => {
    const code = motherCountryCode === "Other" ? customMotherCountryCode : motherCountryCode;
    setMotherMobile(motherMobileRaw ? `${code}${motherMobileRaw}` : "");
  }, [motherCountryCode, customMotherCountryCode, motherMobileRaw]);

  // Auto calculate age from DOB
  useEffect(() => {
    if (dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge >= 0 ? calculatedAge : 0);
    } else {
      setAge("");
    }
  }, [dateOfBirth]);

  // Auto populate primary notification number based on selected parent
  useEffect(() => {
    if (primaryContact === "Father") {
      setPrimaryNotificationNumber(fatherMobile);
    } else if (primaryContact === "Mother") {
      setPrimaryNotificationNumber(motherMobile);
    } else {
      setPrimaryNotificationNumber("");
    }
  }, [primaryContact, fatherMobile, motherMobile]);

  useEffect(() => {
    fetch(`/api/erp/public-details?centerId=${centerId}&teacherId=${teacherIdFromUrl}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBranding({
            centerName: data.centerName || "My Abacus Academy",
            centerLogo: data.centerLogo || null,
            teacherName: data.teacherName || null
          });
          setCourses(data.courses || []);
          setTeachers(data.teachers || []);
          setCenterBatches(data.batches || []);
          if (data.courses && data.courses.length > 0) {
            setCourseId(data.courses[0].id);
          }
          if (!teacherIdFromUrl && data.teachers && data.teachers.length > 0) {
            setSelectedTeacherId(data.teachers[0].id);
          } else {
            setSelectedTeacherId(teacherIdFromUrl || "T001");
          }
        }
      })
      .catch(err => console.error("Error loading public details:", err));
  }, [centerId, teacherIdFromUrl]);

  // Find selected teacher's slots
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
  const availableSlots = selectedTeacher?.availableSlots || [];

  useEffect(() => {
    const selectedSlotFromUrl = params.get("selected_slot") || "";
    if (selectedSlotFromUrl) {
      setBatch(selectedSlotFromUrl);
      setIsCustomTiming(false);
    } else if (availableSlots && availableSlots.length > 0) {
      if (!isCustomTiming && !availableSlots.includes(batch) && batch !== "") {
        setBatch(availableSlots[0]);
      }
    } else {
      if (!isCustomTiming) {
        setBatch("");
      }
    }
  }, [selectedTeacherId, teachers, availableSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentName.trim()) {
      setErrorMsg("Please enter the student's full name.");
      return;
    }

    if (!email || !email.trim()) {
      setErrorMsg("Please enter a student email address for login.");
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMsg("Please create and confirm your account password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    // Check at least one parent contact is provided
    if (!fatherName && !fatherMobileRaw && !motherName && !motherMobileRaw) {
      setErrorMsg("Please fill in contact details for at least one parent (Father or Mother).");
      return;
    }

    if (fatherName && !fatherMobileRaw) {
      setErrorMsg("Please enter Father's Mobile Number.");
      return;
    }

    if (motherName && !motherMobileRaw) {
      setErrorMsg("Please enter Mother's Mobile Number.");
      return;
    }

    if (!fatherMobileRaw && !motherMobileRaw) {
      setErrorMsg("Please enter a valid mobile number for Father or Mother.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const payload = {
      studentName,
      dateOfBirth,
      age,
      gender,
      fatherName,
      fatherMobile,
      motherName,
      motherMobile,
      primaryContact,
      primaryNotificationNumber,
      address,
      city,
      state,
      pincode,
      country: country === "Other" ? (customCountry || "Other") : country,
      email,
      password,
      school,
      currentLevel,
      batch,
      teacherId: selectedTeacherId || "T001",
      centerId,
      courseId,
      courseName: courses.find(c => c.id === courseId)?.name || "Abacus",
      classMode
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("/api/erp/public-register-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(data.error || "Failed to register student. Please check details and try again.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.name === "AbortError") {
        setErrorMsg("Registration request timed out. Please check your internet connection and try submitting again.");
      } else {
        setErrorMsg("Connection error or server issue. Please try submitting again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50/50 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white font-sans">
        <div className="w-full max-w-md bg-white border border-slate-150 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="inline-flex w-16 h-16 bg-emerald-100 rounded-full items-center justify-center text-emerald-600 shadow-md">
            <Check className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-indigo-950 font-display">Registration Successful!</h2>
            <p className="text-sm font-semibold text-slate-600">
              Welcome aboard, <span className="text-indigo-600 font-extrabold">{studentName}</span>!
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-550 leading-relaxed font-semibold space-y-2">
            <p>
              Your student account has been created and linked to instructor <span className="text-indigo-600 font-black">{branding.teacherName || "your teacher"}</span> at <span className="text-indigo-600 font-black">{branding.centerName}</span>.
            </p>
            <div className="border-t border-slate-200/60 my-2 pt-2 text-left space-y-1">
              <p className="text-xs text-slate-600"><strong>Primary Notification Line Set:</strong></p>
              <p className="text-[11px] text-slate-500">📞 {primaryNotificationNumber} ({primaryContact})</p>
              <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                WhatsApp notifications & Alerts enabled automatically.
              </p>
            </div>
            <p className="text-[10px] text-slate-400">
              Use your registered email <strong className="text-slate-700">{email}</strong> to sign in and start practicing!
            </p>
          </div>

          <div className="pt-2">
            <a
              href="/"
              className="inline-flex w-full justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              Go to Student Login
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>{branding.centerName} Learning Suite</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50/50 flex items-center justify-center p-4 sm:p-6 selection:bg-indigo-500 selection:text-white font-sans">
      <div className="w-full max-w-2xl bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-8 animate-fadeIn">
        
        {/* Header decoration */}
        <div className="text-center space-y-2.5">
          {branding.centerLogo ? (
            <img 
              src={branding.centerLogo} 
              alt={branding.centerName} 
              className="h-14 mx-auto object-contain rounded-xl max-w-[160px]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="inline-flex w-12 h-12 bg-indigo-600 text-white rounded-2xl items-center justify-center font-black text-base shadow-md uppercase">
              {branding.centerName.split(" ").map(w => w[0]).join("").slice(0, 2) || "AA"}
            </div>
          )}

          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full text-indigo-700 text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Official Student Enrollment
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-indigo-950 font-display tracking-tight">
            Student Registration Form
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Complete your onboarding details for <strong className="text-indigo-600">{branding.centerName}</strong>
          </p>

          {branding.teacherName && (
            <p className="text-xs text-indigo-650 font-bold">
              Assigned Instructor: <span className="bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">{branding.teacherName}</span>
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs font-semibold leading-relaxed">
            <span className="block font-black text-rose-950">Registration Error</span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* ==================== STUDENT DETAILS ==================== */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Student Details
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Student Full Name <strong className="text-rose-500">*</strong></span>
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student's full name"
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Date of Birth <strong className="text-rose-500">*</strong></span>
                </label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              {/* Age (Auto-calculated) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Age (Auto Calculated)
                </label>
                <input
                  type="text"
                  disabled
                  value={age !== "" ? `${age} years old` : "Select Date of Birth"}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-xs cursor-not-allowed"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gender <strong className="text-rose-500">*</strong>
                </label>
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs text-slate-750"
                >
                  <option value="">-- Choose Gender --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* School (Optional Helper) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-500" />
                  <span>School Name (Optional)</span>
                </label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Enter student's school"
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              {/* Learning level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Starting Level</span>
                </label>
                <select
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                    <option key={l} value={l}>Level {l}</option>
                  ))}
                </select>
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Enroll in Course <strong className="text-rose-500">*</strong></span>
                </label>
                <select
                  required
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.duration})</option>
                  ))}
                  {courses.length === 0 && <option value="c_abacus">Abacus</option>}
                </select>
              </div>

              {/* Class Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Learning Mode <strong className="text-rose-500">*</strong></span>
                </label>
                <select
                  required
                  value={classMode}
                  onChange={(e) => setClassMode(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                >
                  <option value="Batch">Batch Classes (Group Learning)</option>
                  <option value="Personal">Personal Classes (1-on-1 Private)</option>
                </select>
              </div>

              {/* Preferred Class Timing / Batch Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    {classMode === "Batch" ? "Select Batch Code & Timings" : "Select Personal Class Schedule"} <strong className="text-rose-500">*</strong>
                  </span>
                </label>
                
                {params.get("selected_slot") ? (
                  <div className="bg-indigo-50 border border-indigo-150 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-indigo-950 block">{params.get("selected_slot")}</span>
                      <span className="text-[10px] text-indigo-600 font-semibold block">Pre-selected by your Instructor / Academy</span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 border border-emerald-250 text-emerald-700 px-3 py-1 rounded-lg font-mono font-bold uppercase shrink-0">Selected</span>
                  </div>
                ) : classMode === "Batch" ? (
                  (centerBatches.length > 0 || availableSlots.length > 0) ? (
                    <div className="space-y-2">
                      <select
                        value={isCustomTiming ? "custom" : batch}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "custom") {
                            setIsCustomTiming(true);
                            setBatch(customBatch);
                          } else {
                            setIsCustomTiming(false);
                            setBatch(val);
                          }
                        }}
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs font-bold text-indigo-950"
                      >
                        <option value="">-- Select Pre-Configured Batch Code & Timing --</option>
                        
                        {/* Formatted Center Batch Codes */}
                        {centerBatches.map((b: any) => {
                          const valStr = b.formattedSlot || `${b.batchCode}: ${b.title || 'Batch'} (${b.days} ${b.startTime} - ${b.endTime})`;
                          return (
                            <option key={b.id || b.batchCode} value={valStr}>
                              🏷️ {b.batchCode} — {b.title || 'Batch'} ({b.days} • {b.startTime} - {b.endTime})
                            </option>
                          );
                        })}

                        {/* Instructor Slot Timings */}
                        {availableSlots
                          .filter(slot => !centerBatches.some(b => b.formattedSlot === slot || b.batchCode === slot))
                          .map((slot: string) => (
                            <option key={slot} value={slot}>🕒 Slot: {slot}</option>
                          ))
                        }

                        <option value="custom">-- Type Custom Batch Code / Timing --</option>
                      </select>

                      {isCustomTiming && (
                        <input
                          type="text"
                          placeholder="Type custom preferred batch code/timing, e.g. BTC-105: Saturday 3:00 PM"
                          value={customBatch}
                          onChange={(e) => {
                            setCustomBatch(e.target.value);
                            setBatch(e.target.value);
                          }}
                          className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Type preferred batch code / timing, e.g. BTC-101"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs font-bold"
                      />
                    </div>
                  )
                ) : (
                  /* Personal 1-on-1 Class Days and Timings Selectors */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100">
                    <div>
                      <label className="block text-[11px] font-extrabold text-indigo-950 mb-1">Class Days</label>
                      <select
                        value={personalDays}
                        onChange={(e) => {
                          const d = e.target.value;
                          setPersonalDays(d);
                          setBatch(`PERSONAL: ${d} (${personalTiming})`);
                        }}
                        className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Saturday & Sunday">Saturday & Sunday</option>
                        <option value="Monday & Wednesday">Monday & Wednesday</option>
                        <option value="Tuesday & Thursday">Tuesday & Thursday</option>
                        <option value="Friday & Saturday">Friday & Saturday</option>
                        <option value="Monday, Wednesday, Friday">Monday, Wednesday, Friday</option>
                        <option value="Daily Weekdays (Mon-Fri)">Daily Weekdays (Mon-Fri)</option>
                        <option value="Sunday Only">Sunday Only</option>
                        <option value="Saturday Only">Saturday Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-indigo-950 mb-1">Class Timings</label>
                      <select
                        value={personalTiming}
                        onChange={(e) => {
                          const t = e.target.value;
                          setPersonalTiming(t);
                          setBatch(`PERSONAL: ${personalDays} (${t})`);
                        }}
                        className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="08:00 AM - 09:00 AM">08:00 AM - 09:00 AM</option>
                        <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                        <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                        <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                        <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                        <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                        <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                        <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                        <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                        <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructor / Teacher Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Assigned Teacher / Instructor <strong className="text-rose-500">*</strong></span>
                </label>
                <select
                  required
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  disabled={!!teacherIdFromUrl}
                  className={`w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs ${
                    teacherIdFromUrl ? "opacity-75 cursor-not-allowed bg-slate-100" : ""
                  }`}
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                  {teachers.length === 0 && <option value="T001">Trainer One</option>}
                </select>
                {teacherIdFromUrl && (
                  <span className="text-[10px] text-indigo-600 font-semibold mt-1 block">
                    ✓ Automatically assigned based on your referral link.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ==================== PARENT DETAILS ==================== */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Parent Details
              </h3>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                Fill Father or Mother details (or both)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Father's Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father's Name
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Father's full name"
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              {/* Father Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Father Mobile Number</span>
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <select
                      value={fatherCountryCode}
                      onChange={(e) => setFatherCountryCode(e.target.value)}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-2 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs w-28"
                    >
                      <option value="+91">India (+91)</option>
                      <option value="+1">USA/CA (+1)</option>
                      <option value="+44">UK (+44)</option>
                      <option value="+61">Australia (+61)</option>
                      <option value="+971">UAE (+971)</option>
                      <option value="+65">Singapore (+65)</option>
                      <option value="+966">Saudi (+966)</option>
                      <option value="+49">Germany (+49)</option>
                      <option value="+33">France (+33)</option>
                      <option value="Other">Other...</option>
                    </select>
                    <input
                      type="tel"
                      value={fatherMobileRaw}
                      onChange={(e) => setFatherMobileRaw(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 9998442747"
                      className="flex-1 bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                    />
                  </div>
                  {fatherCountryCode === "Other" && (
                    <div className="animate-fadeIn">
                      <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5 uppercase tracking-wider">
                        Specify Country Code (e.g. India is +91)
                      </label>
                      <input
                        type="text"
                        value={customFatherCountryCode}
                        onChange={(e) => setCustomFatherCountryCode(e.target.value)}
                        placeholder="e.g. +91"
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Mother's Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mother's Name
                </label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="Mother's full name"
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              {/* Mother Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Mother Mobile Number</span>
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <select
                      value={motherCountryCode}
                      onChange={(e) => setMotherCountryCode(e.target.value)}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-2 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs w-28"
                    >
                      <option value="+91">India (+91)</option>
                      <option value="+1">USA/CA (+1)</option>
                      <option value="+44">UK (+44)</option>
                      <option value="+61">Australia (+61)</option>
                      <option value="+971">UAE (+971)</option>
                      <option value="+65">Singapore (+65)</option>
                      <option value="+966">Saudi (+966)</option>
                      <option value="+49">Germany (+49)</option>
                      <option value="+33">France (+33)</option>
                      <option value="Other">Other...</option>
                    </select>
                    <input
                      type="tel"
                      value={motherMobileRaw}
                      onChange={(e) => setMotherMobileRaw(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 9998442747"
                      className="flex-1 bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                    />
                  </div>
                  {motherCountryCode === "Other" && (
                    <div className="animate-fadeIn">
                      <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5 uppercase tracking-wider">
                        Specify Country Code (e.g. India is +91)
                      </label>
                      <input
                        type="text"
                        value={customMotherCountryCode}
                        onChange={(e) => setCustomMotherCountryCode(e.target.value)}
                        placeholder="e.g. +91"
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ==================== PRIMARY CONTACT SETTINGS ==================== */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Primary Contact Settings
              </h3>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-2">
                  Primary Contact Person <strong className="text-rose-500">*</strong>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="primaryContact"
                      required
                      value="Father"
                      checked={primaryContact === "Father"}
                      onChange={() => setPrimaryContact("Father")}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span>Father</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="primaryContact"
                      required
                      value="Mother"
                      checked={primaryContact === "Mother"}
                      onChange={() => setPrimaryContact("Mother")}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span>Mother</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Primary Notification Number
                </label>
                <input
                  type="text"
                  disabled
                  value={primaryNotificationNumber || "Select Father or Mother above to automatically populate"}
                  className="w-full bg-slate-200/80 border border-slate-300 text-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-black shadow-xs cursor-not-allowed"
                />
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed font-medium space-y-1 bg-white border border-slate-200 rounded-xl p-3 shadow-inner">
                <p className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                  This number will automatically receive:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] pl-3 text-slate-600 font-semibold mt-1">
                  <span className="flex items-center gap-1">🟢 WhatsApp Notifications</span>
                  <span className="flex items-center gap-1">🟢 Attendance Alerts</span>
                  <span className="flex items-center gap-1">🟢 Homework Notifications</span>
                  <span className="flex items-center gap-1">🟢 Fee Reminders</span>
                  <span className="flex items-center gap-1">🟢 Class Updates</span>
                  <span className="flex items-center gap-1">🟢 Competition Updates</span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== ADDRESS DETAILS ==================== */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Address Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Full Address */}
              <div className="sm:col-span-12">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Full Address (Optional)</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Building Name, Street Name, Locality"
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              {/* City */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City (Optional)
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bangalore"
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              {/* State */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  State / Province (Optional)
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Karnataka"
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              {/* Pincode */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Postal Code / ZIP Code (Optional)
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 560001"
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              {/* Country */}
              <div className="sm:col-span-12 space-y-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Country <strong className="text-rose-500">*</strong>
                </label>
                <select
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                >
                  <option value="India">India (+91)</option>
                  <option value="United States">United States (+1)</option>
                  <option value="United Kingdom">United Kingdom (+44)</option>
                  <option value="Canada">Canada (+1)</option>
                  <option value="Australia">Australia (+61)</option>
                  <option value="Singapore">Singapore (+65)</option>
                  <option value="UAE">United Arab Emirates (+971)</option>
                  <option value="Saudi Arabia">Saudi Arabia (+966)</option>
                  <option value="Germany">Germany (+49)</option>
                  <option value="France">France (+33)</option>
                  <option value="Other">Other Country...</option>
                </select>

                {country === "Other" && (
                  <div className="animate-fadeIn">
                    <label className="block text-[11px] font-bold text-slate-650 mb-1">
                      Specify Country Name <strong className="text-rose-500">*</strong>
                    </label>
                    <input
                      type="text"
                      required
                      value={customCountry}
                      onChange={(e) => setCustomCountry(e.target.value)}
                      placeholder="Enter country name"
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ==================== LOGIN ACCOUNT ==================== */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Login Account
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Student Email Address */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Student Email Address <strong className="text-rose-500">*</strong></span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. genius@gmail.com"
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                />
                <p className="text-[10px] text-slate-450 mt-1 font-medium">This email address will serve as the student's unique login username.</p>
              </div>

              {/* Create Password */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Create Password <strong className="text-rose-500">*</strong></span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create security password"
                    className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Confirm Password <strong className="text-rose-500">*</strong></span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Verify security password"
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* ==================== SUBMIT SECTION ==================== */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all hover:opacity-95 shadow-md disabled:bg-indigo-400 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting Registration...</span>
              ) : (
                <>
                  <span>Complete Student Registration & Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[10px] sm:text-xs text-slate-500 leading-relaxed font-semibold space-y-1">
              <span className="text-indigo-900 font-extrabold uppercase tracking-wider block mb-1">🚀 Automated Actions Enabled on Submission:</span>
              <p>✔ Instantly creates Student Active Login Account with password encryption mapping</p>
              <p>✔ Dynamically compiles primary Parent Contact Profile details</p>
              <p>✔ Archives demographic full Address Information database mapping</p>
              <p>✔ Connects automated alert gateways for real-time WhatsApp Notifications</p>
              <p>✔ Authorizes dynamic sign-in capabilities inside the Student Practice Portal</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
