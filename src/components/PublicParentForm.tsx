import React, { useState, useEffect } from "react";
import { Sparkles, Check, Phone, User, Calendar, Award, Compass, Heart, ExternalLink, Clock, MapPin } from "lucide-react";

export default function PublicParentForm() {
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [parentName, setParentName] = useState("");
  const [city, setCity] = useState("");
  const [parentCountryCode, setParentCountryCode] = useState("+91");
  const [customParentCountryCode, setCustomParentCountryCode] = useState("+91");
  const [parentMobileRaw, setParentMobileRaw] = useState("");
  const [contact, setContact] = useState("");
  const [demoTiming, setDemoTiming] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [returnedRedirectUrl, setReturnedRedirectUrl] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [registeredCount, setRegisteredCount] = useState<number | null>(null);

  // Sync contact when country code or raw mobile raw changes
  useEffect(() => {
    const code = parentCountryCode === "Other" ? customParentCountryCode : parentCountryCode;
    setContact(parentMobileRaw ? `${code}${parentMobileRaw}` : "");
  }, [parentCountryCode, customParentCountryCode, parentMobileRaw]);

  const [config, setConfig] = useState({
    badgeText: "FREE ABACUS TRIAL & DEMO SESSION",
    heading: "RESERVE YOUR CHILD'S FREE SEAT NOW!",
    subtext: "Reserve Your Child's FREE Seat Now! 30-Day Online Abacus Challenge For Children Age 7-14 Years",
    imageUrl: "",
    btnText: "REGISTER MY CHILD'S TRIAL SESSION 🚀",
    btnBgColor: "#dc2626",
    btnTextColor: "#ffffff",
    redirectUrl: "",
    timingTitle: "Preferred Demo Timing",
    timingDisplayMode: "dropdown", // 'dropdown' | 'info_box' | 'hidden'
    infoBoxText: "📅 LIVE CLASS SCHEDULE\nStarts 1st August 2026\nSaturday: 6:00 PM – 7:00 PM\nSunday: 10:00 AM – 11:00 AM\n💻 Live Online on Zoom",
    timings: [
      "Saturday Morning (10:00 AM - 11:30 AM)",
      "Saturday Evening (4:00 PM - 5:30 PM)",
      "Sunday Morning (10:00 AM - 11:30 AM)",
      "Sunday Evening (4:00 PM - 5:30 PM)",
      "Weekday Online Evening (6:00 PM - 7:00 PM)"
    ],
    autoSelectTiming: true,
    footerText: "By registering, you agree to receive trial confirmation alerts on your contact number.",
    campaignName: "Public Parent Form"
  });

  const getAcademyName = () => {
    if (config && config.heading) {
      let name = config.heading;
      name = name.replace(/\s*(?:CRM Desk|CRM|Desk|Form|Registration|Portal|Learning Suite|Management)\b/gi, "").trim();
      return name || "My Abacus Academy";
    }
    return "My Abacus Academy";
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const centerIdFromUrl = params.get("center") || "C001";
    const formIdFromUrl = params.get("form") || params.get("formId") || "";
    fetch(`/api/erp/form-config?centerId=${centerIdFromUrl}&form=${formIdFromUrl}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setConfig(data.config);
          const mode = data.config.timingDisplayMode || "dropdown";
          if (mode === "info_box") {
            setDemoTiming(data.config.infoBoxText ? data.config.infoBoxText.replace(/\n/g, " | ") : "Live Class Schedule");
          } else if (mode === "hidden") {
            setDemoTiming("Standard Registration");
          } else {
            // Auto select default timing if configured or if only 1 option available
            if (data.config.timings && data.config.timings.length > 0) {
              if (data.config.autoSelectTiming || data.config.timings.length === 1) {
                setDemoTiming(data.config.timings[0]);
              }
            }
          }
        }
      })
      .catch(err => console.error("Error loading form configuration:", err));
  }, []);

  // Helper to safely navigate top window or current window if embedded in iframe
  const performRedirect = (target: string) => {
    if (!target) return;
    const formattedTarget = target.startsWith("http://") || target.startsWith("https://") ? target : `https://${target}`;
    if (window.top && window.top !== window.self) {
      try {
        window.top.location.href = formattedTarget;
        return;
      } catch (e) {
        console.warn("Could not navigate top window directly, falling back to window.open", e);
      }
    }
    window.location.href = formattedTarget;
  };

  // Handle automatic redirect timer upon successful submission
  useEffect(() => {
    if (redirectCountdown !== null) {
      if (redirectCountdown <= 0) {
        const target = returnedRedirectUrl || config.redirectUrl;
        if (target) {
          performRedirect(target);
        }
      } else {
        const timer = setTimeout(() => {
          setRedirectCountdown(prev => (prev !== null ? prev - 1 : 0));
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [redirectCountdown, returnedRedirectUrl, config.redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveTiming = demoTiming || (config.timingDisplayMode === "info_box" ? (config.infoBoxText ? config.infoBoxText.replace(/\n/g, " | ") : "Live Class Schedule") : "Standard Registration");

    if (!childName || !parentName || !contact || !childAge || !city) {
      setErrorMsg("Please fill in all the required fields.");
      return;
    }

    if (config.timingDisplayMode === "dropdown" && !demoTiming) {
      setErrorMsg("Please select a preferred timing slot.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    // Package details into remarks field to preserve full compatibility
    const remarksPayload = `City: ${city} | Child Age: ${childAge} yrs | ${config.timingTitle || "Timing"}: ${effectiveTiming}`;

    // Extract center ID dynamically from the URL query parameter
    const params = new URLSearchParams(window.location.search);
    const centerIdFromUrl = params.get("center") || "C001";

    const payload = {
      name: childName,
      parentName: parentName,
      parentMobile: contact,
      city: city,
      source: "Parent Shareable Form",
      campaign: config.campaignName || "Public Parent Form",
      counsellor: "Staff Lead Desk",
      status: "New Lead",
      remarks: remarksPayload,
      centerId: centerIdFromUrl
    };

    try {
      const res = await fetch("/api/erp/add-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (data.registrationCount) {
          setRegisteredCount(data.registrationCount);
        }
        const targetUrl = data.redirectUrl || config.redirectUrl;
        if (targetUrl) {
          setReturnedRedirectUrl(targetUrl);
          setRedirectCountdown(3);
        }
        setIsSuccess(true);
      } else {
        setErrorMsg(data.error || "Something went wrong while submitting the form. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection error. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    const activeRedirectTarget = returnedRedirectUrl || config.redirectUrl;
    const formattedRedirectUrl = activeRedirectTarget
      ? (activeRedirectTarget.startsWith("http://") || activeRedirectTarget.startsWith("https://")
          ? activeRedirectTarget
          : `https://${activeRedirectTarget}`)
      : "";

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50/50 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white font-sans">
        <div className="w-full max-w-md bg-white border border-slate-150 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="inline-flex w-16 h-16 bg-emerald-100 rounded-full items-center justify-center text-emerald-600 shadow-md">
            <Check className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-indigo-950 font-display">Enquiry Submitted!</h2>
            <p className="text-sm font-semibold text-slate-600">
              Thank you, <span className="text-indigo-600 font-extrabold">{parentName}</span>. Your slot for <span className="text-indigo-600 font-extrabold">{childName}</span> is being processed!
            </p>
            {registeredCount && registeredCount > 1 && (
              <div className="pt-2">
                <span className="inline-block bg-amber-50 text-amber-900 border border-amber-300 px-3.5 py-1.5 rounded-full text-xs font-black shadow-2xs">
                  📱 Registration #{registeredCount} for phone {contact}
                </span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-550 leading-relaxed font-semibold">
            Our Senior Abacus Trainer will reach out to you on <span className="text-slate-800 font-black">{contact}</span> to confirm your preferred slot: <span className="text-slate-800 font-black">{demoTiming}</span>.
          </div>

          {activeRedirectTarget && (
            <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-4 text-xs text-indigo-950 font-semibold space-y-3">
              <div className="flex items-center justify-center gap-2 text-indigo-700 font-bold">
                <ExternalLink className="w-4 h-4 animate-bounce" />
                <span>
                  {redirectCountdown !== null && redirectCountdown > 0
                    ? `Redirecting to confirmation page in ${redirectCountdown}s...`
                    : "Redirecting..."}
                </span>
              </div>
              <a
                href={formattedRedirectUrl}
                target="_top"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  performRedirect(activeRedirectTarget);
                }}
                className="inline-flex items-center justify-center w-full bg-indigo-600 text-white font-black text-xs py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md cursor-pointer"
              >
                Continue Immediately &rarr;
              </a>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => {
                setChildName("");
                setChildAge("");
                setParentName("");
                setCity("");
                setParentMobileRaw("");
                setContact("");
                setDemoTiming("");
                setRedirectCountdown(null);
                setIsSuccess(false);
              }}
              style={{ backgroundColor: config.btnBgColor, color: config.btnTextColor }}
              className="w-full font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-all hover:opacity-90 shadow-md cursor-pointer"
            >
              Submit Another Response
            </button>
          </div>

          <div className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>{getAcademyName()} Learning Suite</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50/50 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white font-sans">
      <div className="w-full max-w-lg bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6 animate-fadeIn">
        
        {/* Header decoration */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full text-indigo-700 text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
            {config.badgeText || "Free Abacus Trial & Demo Session"}
          </div>

          {config.imageUrl && (
            <div className="overflow-hidden rounded-2xl border border-slate-150 max-h-48 flex items-center justify-center bg-slate-50 shadow-xs my-2">
              <img src={config.imageUrl} alt="Form Banner" className="w-full h-full object-cover max-h-48" />
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl font-black text-indigo-950 font-display tracking-tight">
            {config.heading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-md mx-auto">
            {config.subtext}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs font-semibold leading-relaxed">
            <span className="block font-black text-rose-950">Submission Error</span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            
            {/* Child Name */}
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Child's Full Name <strong className="text-rose-500">*</strong></span>
              </label>
              <input
                type="text"
                required
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Enter child's name"
                className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
              />
            </div>

            {/* Child Age */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-500" />
                <span>Child's Age <strong className="text-rose-500">*</strong></span>
              </label>
              <input
                type="number"
                required
                min="4"
                max="18"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                placeholder="Age (e.g. 8)"
                className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Parent Name */}
            <div className="min-w-0">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                <span>Parent / Guardian Name <strong className="text-rose-500">*</strong></span>
              </label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Enter parent's name"
                className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
              />
            </div>

            {/* City */}
            <div className="min-w-0">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span>City <strong className="text-rose-500">*</strong></span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
                className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
              />
            </div>
          </div>

          {/* Contact Number */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-500" />
              <span>Contact Number (WhatsApp) <strong className="text-rose-500">*</strong></span>
            </label>
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex gap-2 min-w-0 items-center">
                <select
                  value={parentCountryCode}
                  onChange={(e) => setParentCountryCode(e.target.value)}
                  className="bg-slate-50/60 border border-slate-200 rounded-xl px-2 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs w-24 sm:w-28 shrink-0"
                >
                  <option value="+91">India (+91)</option>
                  <option value="+1">USA/CA (+1)</option>
                  <option value="+44">UK (+44)</option>
                  <option value="+61">Aus (+61)</option>
                  <option value="+971">UAE (+971)</option>
                  <option value="+65">SG (+65)</option>
                  <option value="+966">Saudi (+966)</option>
                  <option value="+49">Germany (+49)</option>
                  <option value="+33">France (+33)</option>
                  <option value="Other">Other...</option>
                </select>
                <input
                  type="tel"
                  required
                  value={parentMobileRaw}
                  onChange={(e) => setParentMobileRaw(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 9998442747"
                  className="flex-1 min-w-0 bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                />
              </div>
              {parentCountryCode === "Other" && (
                <div className="animate-fadeIn min-w-0">
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5 uppercase tracking-wider">
                    Specify Country Code (e.g. India is +91) <strong className="text-rose-500">*</strong>
                  </label>
                  <input
                    type="text"
                    required
                    value={customParentCountryCode}
                    onChange={(e) => setCustomParentCountryCode(e.target.value)}
                    placeholder="e.g. +91"
                    className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preferred Demo / Batch Schedule Section */}
          {config.timingDisplayMode !== "hidden" && (
            <div>
              {config.timingDisplayMode === "dropdown" && (
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{config.timingTitle || "Preferred Demo Timing"} <strong className="text-rose-500">*</strong></span>
                </label>
              )}

              {config.timingDisplayMode === "info_box" ? (
                <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-purple-50/80 border border-indigo-200/80 rounded-2xl p-4 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-950 uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <span>{config.timingTitle || "LIVE CLASS SCHEDULE"}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-850 whitespace-pre-line leading-relaxed bg-white/90 p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                    {config.infoBoxText || "📅 LIVE CLASS SCHEDULE\nStarts 1st August 2026\nSaturday: 6:00 PM – 7:00 PM\nSunday: 10:00 AM – 11:00 AM\n💻 Live Online on Zoom"}
                  </div>
                </div>
              ) : (
                <select
                  required
                  value={demoTiming}
                  onChange={(e) => setDemoTiming(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors shadow-xs"
                >
                  <option value="">-- Choose your preferred slot --</option>
                  {config.timings && config.timings.map((timeOption, idx) => (
                    <option key={idx} value={timeOption}>{timeOption}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ backgroundColor: config.btnBgColor, color: config.btnTextColor }}
            className="w-full font-black text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all active:scale-[0.99] hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-md"
          >
            {isSubmitting ? "Submitting Request..." : (config.btnText || "Register My Child's Trial Session 🚀")}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400 font-semibold border-t border-slate-100 pt-4">
          {config.footerText || "By registering, you agree to receive trial confirmation alerts on your contact number."}
        </div>
      </div>
    </div>
  );
}
