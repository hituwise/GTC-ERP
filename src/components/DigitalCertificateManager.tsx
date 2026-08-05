import React, { useState, useEffect } from "react";
import { Teacher, Student, CertificateRecord, Center } from "../types";
import { 
  Award, Upload, ShieldCheck, CheckCircle2, Image as ImageIcon, 
  Send, Eye, FileText, Sparkles, Loader2, PenTool, Trash2, RefreshCw 
} from "lucide-react";
import DigitalCertificateViewer from "./DigitalCertificateViewer";

interface DigitalCertificateManagerProps {
  currentTeacher: Teacher;
  students: Student[];
  center?: Center;
  teachers?: Teacher[];
  onRefreshData?: () => Promise<void>;
}

export default function DigitalCertificateManager({
  currentTeacher,
  students,
  center,
  teachers = [],
  onRefreshData
}: DigitalCertificateManagerProps) {
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"certificates" | "issue" | "branding">("certificates");
  const [selectedCertForView, setSelectedCertForView] = useState<CertificateRecord | null>(null);

  // Center Branding form states
  const [logo, setLogo] = useState(center?.logo || "");
  const [signature, setSignature] = useState(center?.signature || "");
  const [signatureTitle, setSignatureTitle] = useState(center?.signatureTitle || "Center Head");
  const [isoLogoUrl, setIsoLogoUrl] = useState(center?.isoLogoUrl || "");
  const [isoText, setIsoText] = useState(center?.isoText || "");
  const [msmeRegNumber, setMsmeRegNumber] = useState(center?.msmeRegNumber || "");
  const [certificateTheme, setCertificateTheme] = useState<"gold" | "indigo" | "emerald" | "crimson" | "dark" | "rosegold" | "classic">(center?.certificateTheme || "gold");
  const [certificateBorderStyle, setCertificateBorderStyle] = useState<"double-gold" | "ornate" | "modern-clean" | "royal-frame">(center?.certificateBorderStyle || "double-gold");
  const [hideScoreOnCertificate, setHideScoreOnCertificate] = useState<boolean>(center?.hideScoreOnCertificate !== undefined ? center.hideScoreOnCertificate : true);
  const [savingBranding, setSavingBranding] = useState(false);

  // Issue Certificate form states
  const [targetStudentId, setTargetStudentId] = useState(students[0]?.id || "");
  const [certTitle, setCertTitle] = useState("Level 1 Abacus Proficiency Certificate");
  const [certType, setCertType] = useState<"Level Exam" | "Competition" | "Merit Award">("Level Exam");
  const [certLevel, setCertLevel] = useState<number>(1);
  const [certScore, setCertScore] = useState<number>(85);
  const [approvedBy, setApprovedBy] = useState(currentTeacher.name || center?.ownerName || "Center Administration");
  const [signatoryTitle, setSignatoryTitle] = useState(center?.signatureTitle || "Center Head");
  const [includeTeacherSignature, setIncludeTeacherSignature] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id || currentTeacher.id || "");
  const [issuing, setIssuing] = useState(false);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/erp/certificates?centerId=${encodeURIComponent(currentTeacher.centerId || "C001")}`);
      const json = await res.json();
      if (json.success) {
        setCertificates(json.certificates || []);
      }
    } catch (e) {
      console.error("Error fetching certificates", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleDeleteCertificate = async (certId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete certificate for ${name}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/erp/certificates/${encodeURIComponent(certId)}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setCertificates(prev => prev.filter(c => c.id !== certId));
        if (onRefreshData) onRefreshData();
      } else {
        alert("Failed to delete certificate: " + (json.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting certificate");
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const res = await fetch("/api/erp/update-center-branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: currentTeacher.centerId || "C001",
          logo,
          signature,
          signatureTitle,
          isoLogoUrl,
          isoText,
          msmeRegNumber,
          certificateTheme,
          certificateBorderStyle,
          hideScoreOnCertificate
        })
      });
      const json = await res.json();
      if (json.success) {
        alert("✅ Center branding, signature, theme & certificate design saved successfully!");
        if (onRefreshData) onRefreshData();
      } else {
        alert(json.error || "Failed updating center branding.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving center branding.");
    } finally {
      setSavingBranding(false);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === targetStudentId);
    if (!student) {
      alert("Please select a student.");
      return;
    }

    setIssuing(true);
    try {
      const teacherObj = (teachers || []).find(t => t.id === selectedTeacherId) || currentTeacher;
      const teacherSig = teacherObj ? (teacherObj.signatureUrl || teacherObj.signature || "") : "";

      const payload = {
        centerId: currentTeacher.centerId || "C001",
        studentId: student.id,
        studentName: student.studentName,
        title: certTitle,
        certificateType: certType,
        level: certLevel,
        score: certScore,
        approvedBy: approvedBy || currentTeacher.name || "Center Administration",
        signatoryTitle: signatoryTitle || "Center Head",
        includeTeacherSignature,
        teacherName: includeTeacherSignature ? (teacherObj?.name || "") : undefined,
        teacherSignatureUrl: includeTeacherSignature ? teacherSig : undefined,
        isoLogoUrl: isoLogoUrl || center?.isoLogoUrl || "",
        isoText: isoText || center?.isoText || "",
        msmeRegNumber: msmeRegNumber || center?.msmeRegNumber || "",
        themeStyle: certificateTheme,
        borderStyle: certificateBorderStyle,
        hideScore: hideScoreOnCertificate
      };

      const res = await fetch("/api/erp/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        alert(`🎉 Digital Certificate successfully issued to ${student.studentName}!`);
        setActiveTab("certificates");
        fetchCertificates();
        if (onRefreshData) onRefreshData();
      } else {
        alert(json.error || "Failed issuing certificate.");
      }
    } catch (err) {
      console.error(err);
      alert("Error issuing certificate.");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-200">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 font-display">
              Digital Certificate & Branding Manager
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Configure center logo and authorized signature to issue verifiable digital certificates.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Auto Exam Certificate Connected</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-between items-center border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("certificates")}
            className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 cursor-pointer ${
              activeTab === "certificates"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            📜 Issued Certificates ({certificates.length})
          </button>

          <button
            onClick={() => setActiveTab("issue")}
            className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "issue"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Award className="w-4 h-4" />
            Issue New Certificate
          </button>

          <button
            onClick={() => setActiveTab("branding")}
            className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "branding"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <PenTool className="w-4 h-4" />
            Branding, Signature & Theme
          </button>
        </div>

        <button
          onClick={fetchCertificates}
          disabled={loading}
          className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer mb-1 active:scale-95"
          title="Force Re-sync Certificates Storage"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-600" : ""}`} />
          <span className="hidden sm:inline">Re-sync Storage</span>
        </button>
      </div>

      {/* TAB 1: CERTIFICATES LIST */}
      {activeTab === "certificates" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400 font-bold flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              Loading certificates...
            </div>
          ) : certificates.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No Digital Certificates Issued Yet</p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Certificates are automatically generated when students complete level exams or competitions, or you can issue custom merit certificates directly.
              </p>
              <button
                onClick={() => setActiveTab("issue")}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Issue Certificate Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-slate-50/80 hover:bg-white p-5 rounded-2xl border border-slate-200 space-y-4 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {cert.certificateType}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 font-display mt-1">
                        {cert.studentName}
                      </h4>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {cert.certificateNumber}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700">
                    {cert.title}
                  </p>

                  <div className="flex justify-between items-center pt-2 text-[11px] border-t border-slate-150">
                    <span className="text-slate-500 font-medium">Issued: {cert.issueDate}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteCertificate(cert.id, cert.studentName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Certificate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedCertForView(cert)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View & Print
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ISSUE CERTIFICATE FORM */}
      {activeTab === "issue" && (
        <form onSubmit={handleIssueCertificate} className="space-y-6 max-w-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Student</label>
              <select
                value={targetStudentId}
                onChange={(e) => setTargetStudentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentName} (Level {s.currentLevel}) - {s.batch || "No Batch"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Certificate Title</label>
              <input
                type="text"
                required
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                placeholder="e.g. Level 1 Abacus Proficiency Certificate"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Certificate Type</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                >
                  <option value="Level Exam">Level Exam</option>
                  <option value="Competition">Competition</option>
                  <option value="Merit Award">Merit Award</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Level (If applicable)</label>
                <select
                  value={certLevel}
                  onChange={(e) => setCertLevel(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                    <option key={lvl} value={lvl}>Level {lvl}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Performance Score (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={certScore}
                onChange={(e) => setCertScore(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
              />
            </div>

            {/* Authorised Signatory Name & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Authorised Signatory Name</label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="e.g. Center Head / Director Name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Authorised Signatory Designation / Heading</label>
                <input
                  type="text"
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  placeholder="e.g. Center Head, Director, Founder"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                />
              </div>
            </div>

            {/* Teacher Signature Inclusion Options */}
            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-150 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTeacherSignature}
                  onChange={(e) => setIncludeTeacherSignature(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-black text-indigo-950">
                  Include Assigned Teacher Name & Signature on Certificate
                </span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6">
                If selected, the certificate will show both the course teacher's signature and the Center Admin's authorized signature. If unchecked, only the Center Admin's signature will be displayed.
              </p>

              {includeTeacherSignature && (
                <div className="pl-6 pt-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Select Assigned Teacher / Trainer</label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold outline-none"
                  >
                    {(teachers && teachers.length > 0 ? teachers : [currentTeacher]).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role || "Teacher"}) { (t.signatureUrl || t.signature) ? "✍️ [Signature Uploaded]" : "⚠️ [No Signature Photo]" }
                      </option>
                    ))}
                  </select>

                  {/* Preview selected teacher's signature status */}
                  {(() => {
                    const sel = (teachers || []).find(t => t.id === selectedTeacherId) || currentTeacher;
                    const sig = sel ? (sel.signatureUrl || sel.signature) : null;
                    return sig ? (
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Teacher Signature Ready for Certificate</span>
                        <img src={sig} alt="Teacher Signature" className="h-6 w-auto border rounded px-1 bg-white" />
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-700 font-medium pt-1">
                        ⚠️ Note: {sel?.name || "This teacher"} does not have a signature photo uploaded yet. You can upload teacher signature photos in Staff Management.
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("certificates")}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={issuing}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              Issue Digital Certificate
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: CENTER BRANDING FORM */}
      {activeTab === "branding" && (
        <form onSubmit={handleSaveBranding} className="space-y-6 max-w-xl">
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Official Center Certificate Branding & Accreditation Credentials
            </p>
            <p>Configure your center's logo, director signature, ISO Certification details, and Govt MSME Registration Number to render authentic certificates.</p>
          </div>

          <div className="space-y-5">
            {/* Center Logo */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">Center / Academy Logo Image</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://... or data:image/png;base64,..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono outline-none"
                />
                <label className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold border border-indigo-200 cursor-pointer shrink-0">
                  Upload File
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setLogo(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              {logo && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block shadow-sm">
                  <img src={logo} alt="Center Logo Preview" className="h-12 w-auto object-contain" />
                </div>
              )}
            </div>

            {/* Director / Authorized Signature */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">Authorized Director / Signatory Image</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="https://... or data:image/png;base64,..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono outline-none"
                />
                <label className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold border border-indigo-200 cursor-pointer shrink-0">
                  Upload File
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setSignature(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              {signature && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block shadow-sm">
                  <img src={signature} alt="Signature Preview" className="h-10 w-auto object-contain" />
                </div>
              )}
            </div>

            {/* Authorised Signatory Designation / Heading */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Authorised Signatory Designation / Heading (Editable)
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={signatureTitle}
                  onChange={(e) => setSignatureTitle(e.target.value)}
                  placeholder="e.g. Center Head, Director, Founder, Principal"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400">Quick Select:</span>
                  {["Center Head", "Director", "Founder", "Managing Director", "Principal", "Authorized Signatory"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSignatureTitle(preset)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border cursor-pointer transition-all ${
                        signatureTitle === preset
                          ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                This heading will be printed beneath the signature line on all generated certificates (e.g., "{signatureTitle || 'Center Head'} • {center?.name || 'Academy'}").
              </p>
            </div>

            {/* ISO Certification Credentials */}
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-3">
              <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                ISO Accreditation & Quality Certification (Optional)
              </h4>
              <p className="text-[11px] text-amber-900 font-medium">
                Note: If no ISO logo and no ISO tagline are entered, the ISO certificate seal will stay hidden on student certificates.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ISO Certification Tagline / Title</label>
                <input
                  type="text"
                  value={isoText}
                  onChange={(e) => setIsoText(e.target.value)}
                  placeholder="e.g. ISO 9001:2015 Certified Academy (Leave blank if not ISO certified)"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ISO Certification Seal Logo (Optional Photo)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={isoLogoUrl}
                    onChange={(e) => setIsoLogoUrl(e.target.value)}
                    placeholder="https://... or upload ISO seal image"
                    className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono outline-none"
                  />
                  <label className="px-3 py-2 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-xl text-xs font-bold border border-amber-300 cursor-pointer shrink-0">
                    Upload ISO Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setIsoLogoUrl(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {isoLogoUrl && (
                  <div className="mt-2 p-2 bg-white border border-slate-200 rounded-xl inline-block shadow-sm">
                    <img src={isoLogoUrl} alt="ISO Logo Preview" className="h-10 w-auto object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* CERTIFICATE DESIGN & COLOR THEME CUSTOMIZATION */}
            <div className="bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-blue-50/80 p-5 rounded-2xl border border-indigo-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 font-display">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Unique Certificate Design & Color Theme
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    Customize your center's certificate color scheme, border style, and score display preference.
                  </p>
                </div>
              </div>

              {/* Theme Palette Cards */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-800">Select Certificate Theme Palette:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "gold", name: "Classic Gold", bg: "bg-amber-100", border: "border-amber-500", text: "text-amber-950", dot: "bg-amber-500" },
                    { id: "indigo", name: "Royal Indigo", bg: "bg-indigo-100", border: "border-indigo-600", text: "text-indigo-950", dot: "bg-indigo-600" },
                    { id: "emerald", name: "Emerald Prestige", bg: "bg-emerald-100", border: "border-emerald-600", text: "text-emerald-950", dot: "bg-emerald-600" },
                    { id: "crimson", name: "Ruby Crimson", bg: "bg-rose-100", border: "border-rose-600", text: "text-rose-950", dot: "bg-rose-600" },
                    { id: "dark", name: "Obsidian Dark", bg: "bg-slate-900", border: "border-amber-400", text: "text-amber-300", dot: "bg-amber-400" },
                    { id: "rosegold", name: "Rose Gold", bg: "bg-pink-100", border: "border-pink-500", text: "text-pink-950", dot: "bg-pink-500" },
                    { id: "classic", name: "Silver Slate", bg: "bg-slate-200", border: "border-slate-500", text: "text-slate-900", dot: "bg-slate-600" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCertificateTheme(item.id as any)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        certificateTheme === item.id
                          ? "bg-white border-2 border-indigo-600 shadow-md ring-2 ring-indigo-200"
                          : "bg-white/80 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${item.dot} shrink-0`} />
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${item.text}`}>{item.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Style & Score Visibility Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">Frame & Border Style:</label>
                  <select
                    value={certificateBorderStyle}
                    onChange={(e) => setCertificateBorderStyle(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="double-gold">Classic Double Border Frame</option>
                    <option value="royal-frame">Royal Heavy Crest Frame</option>
                    <option value="modern-clean">Modern Clean Minimal Border</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2.5 cursor-pointer bg-white p-3 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={hideScoreOnCertificate}
                      onChange={(e) => setHideScoreOnCertificate(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Hide Raw Score % on Certificates</span>
                      <span className="text-[10px] text-slate-500 block">
                        Students access their instant Exam Performance Report Card in dashboard instead.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Govt MSME Registration Number */}
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/80 space-y-2">
              <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Government MSME Registration Details
              </h4>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">MSME Udyam / Govt Registration No.</label>
              <input
                type="text"
                value={msmeRegNumber}
                onChange={(e) => setMsmeRegNumber(e.target.value)}
                placeholder="e.g. UDYAM-MH-01-0012345 or Reg No: 48202"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-indigo-950 outline-none"
              />
              <p className="text-[10px] text-slate-500">
                Adding your MSME registration number prints an official Govt MSME verification tag on student digital certificates.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={savingBranding}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingBranding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Save Center Branding
            </button>
          </div>
        </form>
      )}

      {/* CERTIFICATE VIEW MODAL */}
      {selectedCertForView && (
        <DigitalCertificateViewer
          certificate={selectedCertForView}
          onClose={() => setSelectedCertForView(null)}
        />
      )}
    </div>
  );
}
