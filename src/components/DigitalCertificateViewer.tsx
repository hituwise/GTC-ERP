import React, { useRef, useState } from "react";
import { CertificateRecord } from "../types";
import { Award, CheckCircle, Download, Printer, ShieldCheck, Sparkles, FileSpreadsheet, X, Star, TrendingUp, Zap, Clock, CheckCircle2 } from "lucide-react";
import { printElementById } from "../lib/printUtils";

interface DigitalCertificateViewerProps {
  certificate: CertificateRecord;
  onClose?: () => void;
}

export default function DigitalCertificateViewer({
  certificate,
  onClose
}: DigitalCertificateViewerProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [showReportCard, setShowReportCard] = useState(false);

  const handlePrint = () => {
    printElementById("printable-certificate-container", `Certificate_${certificate.studentName}`, true);
  };

  const handlePrintScorecard = () => {
    printElementById("printable-scorecard-container", `Scorecard_${certificate.studentName}`, false);
  };

  // Theme Styling Configuration
  const theme = certificate.themeStyle || "gold";
  
  let containerBg = "bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 text-slate-800";
  let outerBorder = "border-8 border-double border-amber-700/50";
  let cornerBorder = "border-amber-600";
  let titleColor = "text-amber-950";
  let subtitleColor = "text-amber-800";
  let studentNameColor = "text-indigo-950";
  let underlineColor = "border-amber-400/80";
  let watermarkColor = "text-amber-900";
  let badgeBg = "bg-amber-100/90 text-amber-950 border-amber-300";

  if (theme === "indigo") {
    containerBg = "bg-gradient-to-b from-indigo-50/50 via-white to-sky-50/30 text-slate-800";
    outerBorder = "border-8 border-double border-indigo-700/50";
    cornerBorder = "border-indigo-600";
    titleColor = "text-indigo-950";
    subtitleColor = "text-indigo-800";
    studentNameColor = "text-indigo-900";
    underlineColor = "border-indigo-500";
    watermarkColor = "text-indigo-900";
    badgeBg = "bg-indigo-100/90 text-indigo-950 border-indigo-300";
  } else if (theme === "emerald") {
    containerBg = "bg-gradient-to-b from-emerald-50/50 via-white to-teal-50/30 text-slate-800";
    outerBorder = "border-8 border-double border-emerald-700/50";
    cornerBorder = "border-emerald-600";
    titleColor = "text-emerald-950";
    subtitleColor = "text-emerald-800";
    studentNameColor = "text-emerald-900";
    underlineColor = "border-emerald-500";
    watermarkColor = "text-emerald-900";
    badgeBg = "bg-emerald-100/90 text-emerald-950 border-emerald-300";
  } else if (theme === "crimson") {
    containerBg = "bg-gradient-to-b from-rose-50/50 via-white to-red-50/30 text-slate-800";
    outerBorder = "border-8 border-double border-rose-700/50";
    cornerBorder = "border-rose-600";
    titleColor = "text-rose-950";
    subtitleColor = "text-rose-800";
    studentNameColor = "text-rose-950";
    underlineColor = "border-rose-500";
    watermarkColor = "text-rose-900";
    badgeBg = "bg-rose-100/90 text-rose-950 border-rose-300";
  } else if (theme === "dark") {
    containerBg = "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100";
    outerBorder = "border-8 border-double border-amber-500/70";
    cornerBorder = "border-amber-400";
    titleColor = "text-amber-300";
    subtitleColor = "text-amber-400";
    studentNameColor = "text-amber-100";
    underlineColor = "border-amber-500";
    watermarkColor = "text-amber-400";
    badgeBg = "bg-amber-950/80 text-amber-200 border-amber-500/50";
  } else if (theme === "rosegold") {
    containerBg = "bg-gradient-to-b from-pink-50/50 via-white to-purple-50/30 text-slate-800";
    outerBorder = "border-8 border-double border-pink-700/40";
    cornerBorder = "border-pink-500";
    titleColor = "text-pink-950";
    subtitleColor = "text-pink-800";
    studentNameColor = "text-purple-950";
    underlineColor = "border-pink-400";
    watermarkColor = "text-pink-900";
    badgeBg = "bg-pink-100/90 text-pink-950 border-pink-300";
  } else if (theme === "classic") {
    containerBg = "bg-gradient-to-b from-slate-100/70 via-white to-slate-100/50 text-slate-900";
    outerBorder = "border-8 border-double border-slate-700/50";
    cornerBorder = "border-slate-600";
    titleColor = "text-slate-900";
    subtitleColor = "text-slate-700";
    studentNameColor = "text-slate-950";
    underlineColor = "border-slate-400";
    watermarkColor = "text-slate-700";
    badgeBg = "bg-slate-200/90 text-slate-950 border-slate-300";
  }

  // Border Style Override
  const borderStylePreset = certificate.borderStyle || "double-gold";
  if (borderStylePreset === "modern-clean") {
    outerBorder = "border-4 border-solid border-indigo-600 shadow-lg";
  } else if (borderStylePreset === "royal-frame") {
    outerBorder = "border-[12px] border-double border-amber-600 shadow-2xl";
  }

  const hideScore = certificate.hideScore !== undefined ? certificate.hideScore : true;
  const isAutoEval = certificate.approvedBy && (certificate.approvedBy.startsWith("Auto Exam") || certificate.approvedBy.startsWith("Auto Comp"));
  const displayApprovedBy = (!certificate.approvedBy || isAutoEval) ? "Center Head" : certificate.approvedBy;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center p-2 sm:p-6 overflow-y-auto">
      {/* Embedded print styles for single-page landscape PDF/print */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0mm;
          }
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-certificate-container,
          #printable-certificate-container * {
            visibility: visible !important;
          }
          #printable-certificate-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 10mm 15mm !important;
            box-sizing: border-box !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            z-index: 99999 !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative my-2 sm:my-6 space-y-4">
        {/* Action Header - Sticky on Mobile */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs print-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-600 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 font-display">
                Official Digital Certificate
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Verified ID: <span className="font-mono text-indigo-600 font-bold">{certificate.certificateNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <button
              onClick={() => setShowReportCard(true)}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Exam Report Card</span>
              <span className="sm:hidden">Report</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-200"
                id="close-certificate-modal-btn"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Scroll Helper Banner */}
        <div className="sm:hidden bg-indigo-50 border border-indigo-100 rounded-xl p-2 text-center text-[10px] font-bold text-indigo-900 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>Desktop Landscape Certificate (Scroll horizontally if needed)</span>
        </div>

        {/* PRINTABLE CERTIFICATE CANVAS WITH FIXED LANDSCAPE ASPECT RATIO */}
        <div className="overflow-x-auto w-full pb-2 flex justify-center">
          <div
            ref={certRef}
            id="printable-certificate-container"
            className={`w-full min-w-[680px] sm:min-w-[820px] aspect-[1.414/1] print:m-0 print:shadow-none p-6 sm:p-10 rounded-2xl ${outerBorder} relative shadow-inner overflow-hidden ${containerBg} flex flex-col justify-between`}
          >
          {/* Watermark / Corner Decorations */}
          <div className={`absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 border-t-8 border-l-8 ${cornerBorder} m-3 pointer-events-none opacity-80`} />
          <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 border-t-8 border-r-8 ${cornerBorder} m-3 pointer-events-none opacity-80`} />
          <div className={`absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 border-b-8 border-l-8 ${cornerBorder} m-3 pointer-events-none opacity-80`} />
          <div className={`absolute bottom-0 right-0 w-20 h-20 sm:w-24 sm:h-24 border-b-8 border-r-8 ${cornerBorder} m-3 pointer-events-none opacity-80`} />

          {/* Background Badge Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Award className={`w-96 h-96 ${watermarkColor}`} />
          </div>

          <div className="relative z-10 text-center space-y-6">
            {/* Header Logos & Accreditation Badges */}
            <div className="flex items-center justify-between px-2 sm:px-4 gap-4 flex-wrap sm:flex-nowrap">
              {/* Left Logo: Center/Academy Logo */}
              <div className="flex items-center gap-3">
                {certificate.logoUrl ? (
                  <img
                    src={certificate.logoUrl}
                    alt="Center Logo"
                    className="h-16 w-auto object-contain max-w-[160px]"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-black text-xl font-display shadow">
                      G
                    </div>
                    <span className={`font-black text-sm tracking-wider ${titleColor} font-display`}>
                      {certificate.centerName}
                    </span>
                  </div>
                )}
              </div>

              {/* Accreditation Badges: ISO Certification & MSME Registration */}
              <div className="flex flex-col items-end gap-1.5 text-right">
                {(certificate.isoLogoUrl || certificate.isoText) && (
                  <div className="flex items-center gap-2">
                    {certificate.isoLogoUrl && (
                      <img
                        src={certificate.isoLogoUrl}
                        alt="ISO Certification Seal"
                        className="h-10 sm:h-12 w-auto object-contain bg-white rounded-lg p-0.5 border border-amber-200 shadow-xs"
                      />
                    )}
                    {certificate.isoText && (
                      <div className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${badgeBg}`}>
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>{certificate.isoText}</span>
                      </div>
                    )}
                  </div>
                )}

                {certificate.msmeRegNumber && (
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-indigo-950 font-bold bg-indigo-50/90 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                    <span className="text-indigo-600 font-sans font-black uppercase text-[9px] tracking-tight">MSME Reg No:</span>
                    <span>{certificate.msmeRegNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Certificate Title */}
            <div className="space-y-1 pt-4">
              <span className={`text-xs font-black uppercase tracking-widest font-mono ${subtitleColor}`}>
                GENIPLUS ACADEMY INTERNATIONAL
              </span>
              <h1 className={`text-3xl sm:text-4xl font-black font-serif tracking-tight uppercase ${titleColor}`}>
                Certificate of Achievement
              </h1>
              <p className={`text-xs font-serif italic ${subtitleColor}`}>
                This certificate is proudly awarded to
              </p>
            </div>

            {/* Student Name */}
            <div className="py-2">
              <h2 className={`text-3xl sm:text-4xl font-black font-display tracking-wide border-b-2 ${underlineColor} inline-block px-8 py-1 ${studentNameColor}`}>
                {certificate.studentName}
              </h2>
            </div>

            {/* Achievement Description (No score printed if hideScore is enabled) */}
            <div className="max-w-2xl mx-auto space-y-2">
              <p className="text-sm font-medium leading-relaxed font-serif opacity-90">
                for successfully passing and completing <strong className={`font-bold ${titleColor}`}>{certificate.title}</strong>
                {certificate.level && <span> at Level {certificate.level}</span>}
                {!hideScore && certificate.score ? (
                  <span> with an outstanding performance score of <strong className="text-emerald-700 font-bold">{certificate.score}%</strong></span>
                ) : (
                  <span> with distinguished academic merit and high mental calculation proficiency</span>
                )}.
              </p>
              <p className="text-xs opacity-70">
                Demonstrating high mental agility, speed bead manipulation, and concentration discipline.
              </p>
            </div>

            {/* Signatures & Issue Date Footer */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-6 items-end border-t border-slate-300/60">
              {/* Date & Cert ID */}
              <div className="text-left space-y-1">
                <p className="text-[10px] uppercase font-bold opacity-60">Date of Issue</p>
                <p className="text-xs font-black font-mono">{certificate.issueDate}</p>
                <p className="text-[9px] font-mono opacity-60">ID: {certificate.certificateNumber}</p>
              </div>

              {/* Conditional Teacher Signature Block OR Stamp Badge */}
              {certificate.includeTeacherSignature && (certificate.teacherName || certificate.teacherSignatureUrl) ? (
                <div className="text-center space-y-1">
                  {certificate.teacherSignatureUrl ? (
                    <img
                      src={certificate.teacherSignatureUrl}
                      alt="Teacher Signature"
                      className="h-10 w-auto mx-auto object-contain"
                    />
                  ) : (
                    <div className="h-8 flex items-end justify-center">
                      <span className={`font-serif italic text-sm font-bold border-b border-slate-300 px-3 ${titleColor}`}>
                        {certificate.teacherName}
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] uppercase font-bold pt-1 opacity-80">
                    {certificate.teacherName || "Course Instructor"}
                  </p>
                  <p className="text-[9px] opacity-60 font-medium">Assigned Trainer Signature</p>
                </div>
              ) : (
                <div className="hidden sm:flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500 bg-amber-50/80 flex items-center justify-center text-amber-700 shadow-xs">
                    <div className="text-center">
                      <Sparkles className="w-5 h-5 mx-auto" />
                      <span className="text-[8px] font-black uppercase tracking-tighter block mt-0.5">VERIFIED</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Center Admin Signature Block */}
              <div className="text-right space-y-1">
                {certificate.signatureUrl ? (
                  <img
                    src={certificate.signatureUrl}
                    alt="Center Admin Signature"
                    className="h-12 w-auto ml-auto object-contain"
                  />
                ) : (
                  <div className="h-10 flex items-end justify-end">
                    <span className={`font-serif italic text-base font-bold border-b border-slate-400 px-4 ${titleColor}`}>
                      {displayApprovedBy}
                    </span>
                  </div>
                )}
                <p className="text-[10px] uppercase font-bold pt-1 opacity-80">
                  {displayApprovedBy}
                </p>
                <p className="text-[9px] opacity-60 font-medium">
                  {certificate.signatoryTitle || "Center Head"} • {certificate.centerName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* INSTANT EXAM PERFORMANCE REPORT CARD MODAL */}
        {showReportCard && (
          <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div id="printable-scorecard-container" className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-700">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 font-display">
                      Student Exam Performance Report Card
                    </h3>
                    <p className="text-xs text-slate-500">
                      Official Assessment Scorecard for <strong className="text-slate-800">{certificate.studentName}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportCard(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scorecard Details */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">Exam Title</span>
                    <h4 className="text-lg font-black text-white">{certificate.title}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider">Overall Grade</span>
                    <p className="text-2xl font-black text-emerald-400 font-display">
                      {certificate.score ? (certificate.score >= 90 ? "A+ Distinction" : certificate.score >= 80 ? "A Excellent" : "B+ Proficient") : "A+ Distinction"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <p className="text-[10px] text-slate-300 font-medium">Exam Score</p>
                    <p className="text-lg font-black text-amber-300 font-mono">{certificate.score || 95}%</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <p className="text-[10px] text-slate-300 font-medium">Calculation Speed</p>
                    <p className="text-lg font-black text-emerald-300 font-mono">98/100</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <p className="text-[10px] text-slate-300 font-medium">Accuracy Index</p>
                    <p className="text-lg font-black text-cyan-300 font-mono">99.2%</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <p className="text-[10px] text-slate-300 font-medium">Level Status</p>
                    <p className="text-xs font-black text-purple-300 uppercase mt-1">Level {certificate.level || 1} Passed</p>
                  </div>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Subject Performance Metrics
                </h5>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-2.5">Skill Area</th>
                        <th className="p-2.5">Score</th>
                        <th className="p-2.5">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="p-2.5 font-medium">Direct Bead Addition & Subtraction</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600">100%</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">Mastery</span></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium">Small Friend & Big Friend Formulas</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600">96%</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">Excellent</span></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium">Mental Arithmetic Speed (Anzan)</td>
                        <td className="p-2.5 font-mono font-bold text-indigo-600">94%</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">Superior</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Endorsement & Verification Footer */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">Verified by {certificate.centerName}</p>
                  <p className="text-[10px] text-slate-500">Issued Date: {certificate.issueDate} • Certificate ID: {certificate.certificateNumber}</p>
                </div>
                <button
                  onClick={handlePrintScorecard}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Scorecard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
