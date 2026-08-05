import React, { useState } from "react";
import { Sparkles, Calculator, Check, CheckCircle2, Building2, Users, Trophy, Phone, Mail, MapPin, ArrowRight, Lock, Star, CreditCard, Tag, ChevronRight, Smartphone, RefreshCw, BookOpen, GraduationCap, Award, ShieldCheck, Heart } from "lucide-react";

interface LandingPageViewProps {
  landingConfig?: any;
  paymentPlans?: any[];
  onOpenLogin?: () => void;
  onOpenParentForm?: () => void;
  onOpenMaterialOrder?: () => void;
  onOpenStudentRegister?: () => void;
}

export default function LandingPageView({
  landingConfig,
  paymentPlans = [],
  onOpenLogin,
  onOpenParentForm,
  onOpenMaterialOrder,
  onOpenStudentRegister
}: LandingPageViewProps) {
  // Billing frequency state for pricing toggle: Monthly or Yearly
  const [billingCycle, setBillingCycle] = useState<"Monthly" | "Yearly">("Monthly");

  // Live Interactive Abacus Speed Drill Preview State
  const [drillNum1, setDrillNum1] = useState(14);
  const [drillNum2, setDrillNum2] = useState(25);
  const [userAnswer, setUserAnswer] = useState("");
  const [drillFeedback, setDrillFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [drillScore, setDrillScore] = useState(0);

  const config = landingConfig || {
    heroHeadline: "Empower Young Minds with Abacus & Mental Arithmetic Genius",
    heroSubtitle: "Complete AI-powered Abacus Learning Platform, Speed Drill Generator, Multi-Center ERP & Live Parent Tracking Suite.",
    heroImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
    primaryCtaText: "Register Child for Free Demo",
    secondaryCtaText: "Explore Features",
    stats: [
      { label: "Active Students", value: "10,000+" },
      { label: "Franchise Centers", value: "150+" },
      { label: "Calculation Speed", value: "10x Faster" },
      { label: "Parent Satisfaction", value: "99.4%" }
    ],
    features: [
      {
        id: "feat_1",
        title: "Abacus Speed Drill Engine",
        description: "Interactive visual bead movement drills, flash cards, and timed mental arithmetic challenges with instant grading.",
        icon: "Calculator",
        image: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=600&auto=format&fit=crop",
        badge: "Core Learning"
      },
      {
        id: "feat_2",
        title: "Multi-Center ERP & CRM",
        description: "Effortlessly manage student admissions, attendance, fee collection, staff payroll, and lead pipelines across branches.",
        icon: "Building2",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop",
        badge: "Center Admin"
      },
      {
        id: "feat_3",
        title: "Digital Certificates & Competitions",
        description: "Automated QR-verified level completion certificates, hall of fame leaderboards, and national competition management.",
        icon: "Trophy",
        image: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?q=80&w=600&auto=format&fit=crop",
        badge: "Recognition"
      },
      {
        id: "feat_4",
        title: "Parent & Student Web Portal",
        description: "Parents track homework progress, fee receipts, practice streaks, and teacher feedback in real-time from any device.",
        icon: "Users",
        image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600&auto=format&fit=crop",
        badge: "Parent App"
      }
    ],
    testimonials: [
      {
        id: "test_1",
        name: "Priya Sharma",
        role: "Parent of Dev (Level 4 Student)",
        comment: "My 8-year-old son can now add and multiply 3-digit numbers mentally within seconds! The speed drills make daily practice feel like a fun game.",
        rating: 5,
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop"
      },
      {
        id: "test_2",
        name: "Rajesh Patel",
        role: "Franchise Center Director",
        comment: "Managing 250+ students across 2 branches used to take hours of manual paperwork. This ERP automated fee reminders, attendance, and lead tracking overnight.",
        rating: 5,
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop"
      }
    ],
    footerTitle: "My Abacus Academy",
    footerDescription: "Leading Abacus, Mental Math & Cognitive Skill Development Platform.",
    contactEmail: "info@abacusacademy.com",
    contactPhone: "+91 99984 42747",
    address: "Global Innovation Center, Tech Park, City Center"
  };

  // Filter plans to active ones
  const activePlans = (paymentPlans && paymentPlans.length > 0
    ? paymentPlans.filter((p: any) => p.status !== "Inactive")
    : [
        {
          id: "PLAN_BASIC",
          name: "Starter Abacus Genius",
          course: "Abacus Level 1 - 4",
          monthlyPrice: 1500,
          yearlyPrice: 14400,
          savingsTag: "Save 20%",
          popular: false,
          features: [
            "2 Live Interactive Classes / Week",
            "Unlimited Abacus Speed Drills",
            "Digital Student Portal Access",
            "Standard Study Worksheets",
            "Monthly Level Performance Reports"
          ],
          description: "Ideal for beginners starting their mental math and abacus journey."
        },
        {
          id: "PLAN_PRO",
          name: "Pro Master Scholar",
          course: "All Courses (Abacus + Vedic Math + Rubiks)",
          monthlyPrice: 2500,
          yearlyPrice: 24000,
          savingsTag: "Save 20%",
          popular: true,
          features: [
            "3 Live Interactive Classes / Week",
            "Free Physical Abacus Tool & Coursebooks Kit",
            "Unlimited Speed Drills & Flash Cards",
            "AI Performance & Mistake Analysis",
            "National Competition Registration Included",
            "Free QR-Verified Digital Certificates"
          ],
          description: "Most popular comprehensive plan for complete brain development."
        },
        {
          id: "PLAN_VIP",
          name: "VIP One-on-One Mentorship",
          course: "Personalized Curriculum",
          monthlyPrice: 4500,
          yearlyPrice: 43200,
          savingsTag: "Save 20%",
          popular: false,
          features: [
            "1-on-1 Dedicated Senior Master Trainer",
            "Flexible Timing & Rescheduling Privileges",
            "VIP Speed Drills & Custom Worksheet Generator",
            "Direct WhatsApp Hotline with Master Trainer",
            "Guaranteed National Competition Medal Coaching"
          ],
          description: "Premium individualized coaching for competition champions."
        }
      ]
  );

  const handleCheckDrill = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = drillNum1 + drillNum2;
    if (parseInt(userAnswer.trim(), 10) === expected) {
      setDrillFeedback("correct");
      setDrillScore(prev => prev + 1);
      setTimeout(() => {
        setDrillNum1(Math.floor(Math.random() * 40) + 10);
        setDrillNum2(Math.floor(Math.random() * 40) + 10);
        setUserAnswer("");
        setDrillFeedback("idle");
      }, 1000);
    } else {
      setDrillFeedback("wrong");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Dynamic Background Glow Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600 blur-[130px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-purple-600 blur-[130px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-emerald-600 blur-[130px]" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-black text-xl font-display">
              🧮
            </div>
            <div>
              <span className="text-base sm:text-lg font-black text-white font-display tracking-tight block">
                {config.footerTitle || "My Abacus Academy"}
              </span>
              <span className="text-[10px] text-indigo-400 font-bold font-mono tracking-wider uppercase block">
                Mental Arithmetic & ERP Suite
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <a href="#features-section" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#speed-drill-section" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
              <span>Speed Drills</span>
              <span className="bg-amber-400/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-black border border-amber-400/30">Interactive</span>
            </a>
            <a href="#pricing-section" className="hover:text-indigo-400 transition-colors">Pricing & Plans</a>
            <a href="#testimonials-section" className="hover:text-indigo-400 transition-colors">Testimonials</a>
          </nav>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onOpenParentForm ? onOpenParentForm() : (window.location.href = "?view=parent-enquiry-form")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-3.5 sm:px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xs:inline">Parent Enquiry</span>
              <span className="xs:hidden">Enquire</span>
            </button>

            <button
              onClick={() => onOpenLogin ? onOpenLogin() : (window.location.href = "/")}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-extrabold text-xs px-3.5 sm:px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Portal Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Next-Gen Abacus & Mental Math ERP Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-display tracking-tight leading-[1.15]">
              {config.heroHeadline || "Empower Young Minds with Abacus & Mental Arithmetic Genius"}
            </h1>

            <p className="text-sm sm:text-lg text-slate-300 leading-relaxed font-medium max-w-2xl">
              {config.heroSubtitle || "Complete AI-powered Abacus Learning Platform, Speed Drill Generator, Multi-Center ERP & Live Parent Tracking Suite."}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onOpenParentForm ? onOpenParentForm() : (window.location.href = "?view=parent-enquiry-form")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>{config.primaryCtaText || "Register Child for Free Demo"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#pricing-section"
                className="bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-extrabold text-sm px-5 py-3.5 rounded-2xl transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>View Monthly & Yearly Plans</span>
              </a>
            </div>

            {/* Quick feature pill tags */}
            <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-400 pt-3">
              <span className="bg-slate-800/60 border border-slate-700/60 px-3 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Speed Drills Engine
              </span>
              <span className="bg-slate-800/60 border border-slate-700/60 px-3 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> QR Digital Certificates
              </span>
              <span className="bg-slate-800/60 border border-slate-700/60 px-3 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Real-time Parent App
              </span>
            </div>
          </div>

          {/* Right Hero Image / Banner Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border-2 border-indigo-500/30 shadow-2xl shadow-indigo-950/50 bg-slate-950">
              <img
                src={config.heroImage || "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop"}
                alt="Abacus Learning"
                className="w-full h-80 sm:h-96 object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Abacus Speed Mastery
                  </span>
                  <span className="text-emerald-400 font-bold font-mono">Live Demo</span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-normal">
                  Students achieve 10x speed in mental calculations within 12 weeks of training.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* IMPACT STATS BANNER */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md text-center">
          {(config.stats || [
            { label: "Active Students", value: "10,000+" },
            { label: "Franchise Centers", value: "150+" },
            { label: "Calculation Speed", value: "10x Faster" },
            { label: "Parent Satisfaction", value: "99.4%" }
          ]).map((st: any, idx: number) => (
            <div key={idx} className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-300">
                {st.value}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {st.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE ABACUS SPEED DRILL PREVIEW */}
      <section id="speed-drill-section" className="relative z-10 py-16 bg-slate-950/80 border-y border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <div className="space-y-2">
            <span className="bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full inline-block">
              ⚡ Try Live Speed Drill
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white font-display">
              Test Mental Speed in 5 Seconds
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Our mental math engine conditions young minds to visualize abacus beads and solve addition & multiplication in milliseconds!
            </p>
          </div>

          <div className="bg-slate-900 border-2 border-indigo-500/40 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-lg mx-auto space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
              <span>Mental Addition Challenge</span>
              <span className="font-bold text-amber-400 font-mono">Score: {drillScore} Points</span>
            </div>

            <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-wider py-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner flex items-center justify-center gap-4">
              <span className="text-indigo-400">{drillNum1}</span>
              <span className="text-amber-400">+</span>
              <span className="text-purple-400">{drillNum2}</span>
              <span className="text-slate-500">=</span>
              <span className="text-emerald-400">?</span>
            </div>

            <form onSubmit={handleCheckDrill} className="flex gap-3">
              <input
                type="number"
                required
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter answer"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-indigo-500 text-center"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg"
              >
                Submit Answer
              </button>
            </form>

            {drillFeedback === "correct" && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-xs font-black animate-bounce">
                🎉 Spot on! Correct answer! Loading next speed question...
              </div>
            )}
            {drillFeedback === "wrong" && (
              <div className="bg-rose-950/80 border border-rose-500/50 text-rose-300 p-3 rounded-xl text-xs font-black animate-shake">
                ❌ Oops! Try again: {drillNum1} + {drillNum2} = {drillNum1 + drillNum2}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features-section" className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-indigo-400 font-extrabold text-xs uppercase tracking-widest font-mono">
            Full-Stack Abacus ERP Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-display">
            Built for Modern Students, Parents & Franchise Centers
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Everything needed to run an elite mental arithmetic academy in one unified cloud system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(config.features || []).map((feat: any) => (
            <div
              key={feat.id}
              className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Calculator className="w-6 h-6" />
                  </div>
                  {feat.badge && (
                    <span className="bg-indigo-900/60 text-indigo-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-indigo-700/40">
                      {feat.badge}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-left">
                  <h3 className="text-lg font-black text-white font-display group-hover:text-indigo-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {feat.description}
                  </p>
                </div>
              </div>

              {feat.image && (
                <div className="mt-6 rounded-2xl overflow-hidden border border-slate-800 h-32">
                  <img
                    src={feat.image}
                    alt={feat.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PRICING & PAYMENT PLANS SECTION (MONTHLY & YEARLY) */}
      <section id="pricing-section" className="relative z-10 py-20 bg-slate-950/90 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-center">
          
          <div className="space-y-4">
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full inline-block">
              💳 Flexible Transparent Payment Plans
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white font-display">
              Choose the Best Plan for Your Child
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Select between monthly pay-as-you-go or save up to 20% with yearly subscription packages. Managed directly by your academy admin!
            </p>

            {/* MONTHLY / YEARLY BILLING TOGGLE SWITCH */}
            <div className="inline-flex items-center bg-slate-900 border border-slate-700 p-1.5 rounded-2xl shadow-xl mt-4">
              <button
                type="button"
                onClick={() => setBillingCycle("Monthly")}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  billingCycle === "Monthly"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("Yearly")}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === "Yearly"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Yearly Billing</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* PAYMENT PLAN CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch text-left">
            {activePlans.map((plan: any) => {
              const isYearly = billingCycle === "Yearly";
              const price = isYearly ? (plan.yearlyPrice || plan.monthlyPrice * 10) : plan.monthlyPrice;
              const perMonthVal = isYearly ? Math.round(price / 12) : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-b from-slate-900 via-indigo-950/80 to-slate-950 border-2 border-indigo-500 shadow-2xl shadow-indigo-900/40 scale-105 z-20"
                      : "bg-slate-900/80 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Most Popular</span>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-black text-white font-display">{plan.name}</h3>
                      <p className="text-xs text-indigo-400 font-bold mt-1">{plan.course}</p>
                      {plan.description && (
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{plan.description}</p>
                      )}
                    </div>

                    {/* Price Display */}
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                          ₹{price.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">
                          / {isYearly ? "year" : "month"}
                        </span>
                      </div>
                      {isYearly && (
                        <div className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Equivalent to ₹{perMonthVal}/mo ({plan.savingsTag || "Save 20%"})</span>
                        </div>
                      )}
                    </div>

                    {/* Included Features List */}
                    <div className="space-y-3 pt-2">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Included Features:
                      </span>
                      <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                        {(plan.features || []).map((feat: string, fIdx: number) => (
                          <li key={fIdx} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-8">
                    <button
                      onClick={() => onOpenParentForm ? onOpenParentForm() : (window.location.href = `?view=parent-enquiry-form&plan=${encodeURIComponent(plan.name)}`)}
                      className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all active:scale-95 cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                        plan.popular
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                          : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                      }`}
                    >
                      <span>Select {plan.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials-section" className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-center">
        <div className="space-y-3">
          <span className="text-amber-400 font-extrabold text-xs uppercase tracking-widest font-mono">
            Parent & Franchise Reviews
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-display">
            Loved by Thousands of Parents & Center Owners
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {(config.testimonials || []).map((t: any) => (
            <div key={t.id} className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(t.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "{t.comment}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
                {t.avatar && (
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" referrerPolicy="no-referrer" />
                )}
                <div>
                  <strong className="text-xs font-black text-white block">{t.name}</strong>
                  <span className="text-[11px] text-slate-400 block font-medium">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-slate-950 border-t border-slate-800 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3 text-left">
            <h4 className="text-sm font-black text-white font-display">{config.footerTitle || "My Abacus Academy"}</h4>
            <p className="leading-relaxed text-slate-400">{config.footerDescription || "Leading Abacus, Mental Math & Cognitive Skill Development Platform."}</p>
            <p className="text-[11px] text-slate-500 font-mono">© 2026 {config.footerTitle || "My Abacus Academy"}. All rights reserved.</p>
          </div>

          <div className="space-y-2 text-left">
            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block mb-2">Quick Navigation</span>
            <ul className="space-y-1.5 font-medium">
              <li><button onClick={() => onOpenParentForm ? onOpenParentForm() : (window.location.href = "?view=parent-enquiry-form")} className="hover:text-white transition-colors">Parent Enquiry Form</button></li>
              <li><button onClick={() => onOpenStudentRegister ? onOpenStudentRegister() : (window.location.href = "?view=student-register")} className="hover:text-white transition-colors">Public Student Registration</button></li>
              <li><button onClick={() => onOpenMaterialOrder ? onOpenMaterialOrder() : (window.location.href = "?view=order-materials")} className="hover:text-white transition-colors">Order Books & Abacus Kits</button></li>
              <li><button onClick={() => onOpenLogin ? onOpenLogin() : (window.location.href = "/")} className="hover:text-white transition-colors">ERP Portal Sign In</button></li>
            </ul>
          </div>

          <div className="space-y-3 text-left">
            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">Contact Academy</span>
            {config.contactPhone && (
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                <span>{config.contactPhone}</span>
              </div>
            )}
            {config.contactEmail && (
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>{config.contactEmail}</span>
              </div>
            )}
            {config.address && (
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{config.address}</span>
              </div>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}
