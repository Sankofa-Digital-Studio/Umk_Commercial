import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  HeartPulse,
  Scale,
  Brain,
  FileText,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export interface TccServiceInfo {
  id: string;
  badge: string;
  title: string;
  timeWindow: string;
  tagline: string;
  icon: React.ReactNode;
  summary: string;
  statutoryBasis: string;
  keySteps: string[];
  rightsNotes: string[];
}

export const TCC_SERVICES_CATALOG: TccServiceInfo[] = [
  {
    id: "forensic-exam",
    badge: "Forensic Medical Exam",
    title: "Forensic Clinical Examination & J88 Dossier",
    timeWindow: "Optimal within 72 hours (admissible up to 7 days)",
    tagline: "Statutory forensic evidence collection and clinical care under Criminal Procedure Act 51 of 1977.",
    icon: <Scale className="w-6 h-6 text-amber-400" />,
    summary:
      "A compassionate, private forensic medical examination conducted by a certified Clinical Forensic Medical Officer or Forensic Nurse. The examination documents all injuries, assesses trauma, and collects DNA evidence to complete statutory Form J88, which serves as primary judicial evidence in court.",
    statutoryBasis:
      "South African Criminal Procedure Act 51 of 1977 & Domestic Violence Act 116 of 1998 Section 4.",
    keySteps: [
      "Dignified, private examination room inside designated Thuthuzela Care Centre (TCC).",
      "Statutory Form J88 completion recording physical injuries, micro-trauma, and clinical findings.",
      "Forensic DNA specimen collection, clothing preservation, and toxicology screening under strict SAPS chain-of-custody.",
      "Photographic documentation using calibrated forensic camera systems with survivor consent.",
    ],
    rightsNotes: [
      "100% Free of charge under South African law at all TCC facilities.",
      "You have the right to decline or pause any part of the exam at any point.",
      "You do NOT need to lay a criminal charge before receiving medical treatment.",
      "You may request a female medical practitioner or female support nurse.",
    ],
  },
  {
    id: "hiv-pep",
    badge: "HIV PEP Prophylaxis",
    title: "Post-Exposure Prophylaxis (PEP) & STI Defense",
    timeWindow: "CRITICAL: Start within 72 hours of exposure",
    tagline: "Immediate 28-day antiretroviral emergency shield against HIV transmission and emergency contraception.",
    icon: <HeartPulse className="w-6 h-6 text-rose-400" />,
    summary:
      "HIV Post-Exposure Prophylaxis (PEP) is a short course of antiretroviral medicines taken for 28 days to prevent HIV infection after potential exposure. The sooner PEP is initiated, the higher its clinical efficacy. Emergency contraception and STI prophylaxis are also administered immediately.",
    statutoryBasis:
      "National Department of Health National Guidelines for Post-Exposure Prophylaxis (PEP) & Clinical Forensic Medicine.",
    keySteps: [
      "Rapid baseline blood tests for HIV, Hepatitis B, and kidney function.",
      "Immediate administration of starter pack: 3-drug antiretroviral regimen for 28 consecutive days.",
      "Emergency contraception (morning-after pill) provided within 120 hours to prevent non-consensual pregnancy.",
      "Broad-spectrum antimicrobial prophylaxis against syphilis, gonorrhea, chlamydia, and trichomoniasis.",
      "Scheduled follow-up testing at 6 weeks and 3 months for complete seroconversion monitoring.",
    ],
    rightsNotes: [
      "Immediate emergency dispensing at all 24/7 public health casualty units and TCCs.",
      "No cost to the survivor; provided free by the South African Government.",
      "Adherence counseling provided to assist with 28-day dosing regimen.",
    ],
  },
  {
    id: "trauma-counseling",
    badge: "Trauma Counseling",
    title: "Containment Counseling & Psychological First Aid",
    timeWindow: "Immediate crisis containment & ongoing therapeutic care",
    tagline: "Dedicated crisis de-escalation, emotional containment, and social worker assistance.",
    icon: <Brain className="w-6 h-6 text-sky-400" />,
    summary:
      "Immediate psychological first aid and emotional de-escalation provided by qualified GBV social workers and counselors. Ensures survivors have a calm, secure space away from public scrutiny, with continuous support through police statement-taking and court proceedings.",
    statutoryBasis:
      "Department of Social Development GBV Framework & Victim Empowerment Programme (VEP).",
    keySteps: [
      "Immediate emotional containment and safe-space isolation from public hospital areas.",
      "Psychological first aid, grounding techniques, and shock mitigation.",
      "Support and accompaniment during SAPS statement-taking and Form 2 Protection Order filing.",
      "Referral to accredited safe houses, DSD shelters, and long-term trauma debriefing.",
    ],
    rightsNotes: [
      "Confidential, trauma-informed, non-judgmental environment.",
      "Family and child accompaniment support available.",
      "Access to statutory GBV Command Centre line (0800 428 428) 24/7/365.",
    ],
  },
];

interface TccServiceInfoModalProps {
  isOpen: boolean;
  initialIndex?: number;
  centreName?: string;
  contactNumber?: string;
  onClose: () => void;
}

export const TccServiceInfoModal: React.FC<TccServiceInfoModalProps> = ({
  isOpen,
  initialIndex = 0,
  centreName,
  contactNumber,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex, isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeIndex]);

  if (!isOpen) return null;

  const currentService = TCC_SERVICES_CATALOG[activeIndex] || TCC_SERVICES_CATALOG[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : TCC_SERVICES_CATALOG.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < TCC_SERVICES_CATALOG.length - 1 ? prev + 1 : 0));
  };

  // Touch swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      // Swiped left -> next
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tcc-service-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              {currentService.icon}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                Statutory TCC Clinical Care • {activeIndex + 1} of {TCC_SERVICES_CATALOG.length}
              </span>
              <span className="text-xs text-slate-300 font-semibold truncate block max-w-[220px]">
                {centreName || "Thuthuzela Care Centre"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Swipe / Tab navigation pills */}
        <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between gap-1">
          {TCC_SERVICES_CATALOG.map((svc, idx) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all truncate text-center ${
                idx === activeIndex
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "bg-slate-850 hover:bg-slate-800 text-slate-400"
              }`}
            >
              {svc.badge}
            </button>
          ))}
        </div>

        {/* Scrollable Content Area with touch swiping */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {currentService.badge}
              </span>
              <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {currentService.timeWindow}
              </span>
            </div>
            <h2 id="tcc-service-title" className="text-base font-bold text-white">
              {currentService.title}
            </h2>
            <p className="text-xs text-amber-200/90 font-medium mt-1">
              {currentService.tagline}
            </p>
          </div>

          {/* Description */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-300">
            {currentService.summary}
          </div>

          {/* Key Clinical & Forensic Steps */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>What Happens During Care</span>
            </h4>
            <div className="space-y-2">
              {currentService.keySteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                  <span className="w-4 h-4 rounded-full bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Survivor Legal Rights & Dignity */}
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Your Statutory Rights & Guarantees</span>
            </h4>
            <div className="space-y-1.5">
              {currentService.rightsNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Statutory Law Citation Banner */}
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/90 text-[11px] text-slate-400 flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-slate-300">Statutory Framework:</strong> {currentService.statutoryBasis}
            </span>
          </div>
        </div>

        {/* Footer with Swiping Chevrons and Call Centre CTA */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Service"
              className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 px-1">
              {TCC_SERVICES_CATALOG.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === activeIndex ? "w-4 bg-amber-400" : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Service"
              className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {contactNumber ? (
            <a
              href={`tel:${contactNumber}`}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Centre: {contactNumber}</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors"
            >
              Understood
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
