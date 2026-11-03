import React, { useEffect, useState, useRef } from "react";
import { Zap, ChevronUp, ChevronDown, MapPin, RefreshCw } from "lucide-react";
import { toggleTheme } from "../services/themeManager";
import {
  MUNICIPAL_TARIFFS,
  MunicipalityTariff,
  calculateMunicipalUnits,
} from "../services/tariffs/municipalTariffEngine";
import {
  generateStsToken,
  DURESS_STS_TOKEN,
} from "../services/sts/stsTokenGenerator";
import { useCalculatorEnvironment } from "./calculator/useCalculatorEnvironment";
import { StsError30Terminal } from "./calculator/StsError30Terminal";
import { UtilityCheatSheetModal } from "./calculator/UtilityCheatSheetModal";
import { ApplianceBenchmarkTable } from "./calculator/ApplianceBenchmarkTable";
import { EducationalAccordions } from "./calculator/EducationalAccordions";
import { CalculatorSidebar } from "./calculator/CalculatorSidebar";
import { CalculatorHeroHeader } from "./calculator/CalculatorHeroHeader";
import { CalculatorFormCard } from "./calculator/CalculatorFormCard";
import { CalculatorResultCard } from "./calculator/CalculatorResultCard";
import { CalculatorFooter } from "./calculator/CalculatorFooter";
import { UatSimulatedCallModal } from "./calculator/UatSimulatedCallModal";
import { WaterConservationSection } from "./decoy/WaterConservationSection";
import { EnergySavingsAuditSection } from "./decoy/EnergySavingsAuditSection";
import { SolarPaybackSection } from "./decoy/SolarPaybackSection";
import { StsMeterGuideSection } from "./decoy/StsMeterGuideSection";

export type UtilityTab = "electricity" | "water" | "energy" | "solar" | "sts_guide";

export interface DecoyResult {
  unitsKwh: number;
  vat: number;
  net: number;
  token: string;
  isDuress?: boolean;
  errorCode?: string;
}

function municipalityForLocation(metro: string, province: string): MunicipalityTariff {
  const value = `${metro} ${province}`.toLowerCase();
  const municipalityId = value.includes("cape town")
    ? "cape-town"
    : value.includes("tshwane") || value.includes("pretoria")
    ? "tshwane"
    : value.includes("ekurhuleni")
    ? "ekurhuleni"
    : value.includes("johannesburg")
    ? "city-power"
    : value.includes("mangaung") || value.includes("bloemfontein") || value.includes("free state")
    ? "mangaung"
    : "eskom";
  return MUNICIPAL_TARIFFS.find((tariff) => tariff.id === municipalityId) || MUNICIPAL_TARIFFS[0];
}

interface Props {
  onUnlockSafeHaven: (source?: "direct" | "covert") => void;
  onDuressTrigger: () => void;
  onOpenBriefing?: () => void;
}

export const MunicipalPrepaidCalculator: React.FC<Props> = ({
  onUnlockSafeHaven,
  onDuressTrigger,
  onOpenBriefing,
}) => {
  const [selectedMuni, setSelectedMuni] = useState<MunicipalityTariff>(
    () => MUNICIPAL_TARIFFS.find((tariff) => tariff.id === "eskom") || MUNICIPAL_TARIFFS[0]
  );
  const [meterNumber, setMeterNumber] = useState("04182948192");
  const [amount, setAmount] = useState("200");
  const [result, setResult] = useState<DecoyResult | null>(null);
  const [showStsErrorModal, setShowStsErrorModal] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<UtilityTab>("electricity");

  const [simulatedCallModal, setSimulatedCallModal] = useState({
    open: false,
    serviceName: "",
    number: "",
    actualService: "",
  });

  const {
    currentTime,
    theme,
    scrollDirection,
    scrollToBoundary,
    loadshedding,
    telemetry,
    uatProfile,
    liveLocation,
    locationStatus,
    refreshLiveLocation,
  } = useCalculatorEnvironment();

  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);
  const portalSequenceRef = useRef("");
  const locationAppliedRef = useRef(false);

  useEffect(() => {
    if (!liveLocation || locationAppliedRef.current) return;
    setSelectedMuni(municipalityForLocation(liveLocation.metro, liveLocation.province));
    locationAppliedRef.current = true;
  }, [liveLocation]);

  useEffect(() => {
    const handlePortalSequence = (event: KeyboardEvent) => {
      if (!/^\d$/.test(event.key)) return;
      portalSequenceRef.current = `${portalSequenceRef.current}${event.key}`.slice(-4);
      if (portalSequenceRef.current === "2468") {
        portalSequenceRef.current = "";
        setShowPortalModal(true);
      }
    };
    window.addEventListener("keydown", handlePortalSequence);
    return () => window.removeEventListener("keydown", handlePortalSequence);
  }, []);

  const handleCrestClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 800) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapRef.current = now;
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      onUnlockSafeHaven();
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token.replace(/\s/g, ""));
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = amount.trim();
    const cleanMeter = meterNumber.trim();

    // Secret Safe Haven unlock PINs
    if (cleanAmount === "8426" || cleanAmount === "1234" || cleanMeter.endsWith("8426")) {
      onUnlockSafeHaven();
      return;
    }

    // Duress PIN — silent SOS beacon + authentic KRN2 Rollover Error 30 terminal display
    if (cleanAmount === "9999" || cleanMeter.endsWith("9999") || cleanAmount === "30") {
      onDuressTrigger();
      setShowStsErrorModal(true);
      const calc = calculateMunicipalUnits(selectedMuni.id, 200);
      setResult({
        unitsKwh: calc.unitsKwh,
        vat: calc.vat,
        net: calc.net,
        token: DURESS_STS_TOKEN,
        isDuress: true,
        errorCode: "STS-ERR-30",
      });
      return;
    }

    const num = parseFloat(cleanAmount);
    if (!isNaN(num) && num > 0) {
      const calc = calculateMunicipalUnits(selectedMuni.id, num);
      const token = generateStsToken(" ");
      setResult({ unitsKwh: calc.unitsKwh, vat: calc.vat, net: calc.net, token });
    }
  };

  const handleReset = () => {
    setResult(null);
    setAmount("200");
    setTokenCopied(false);
  };

  const handleSelectTab = (tab: UtilityTab) => {
    setActiveTab(tab);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const handlePortalClose = (didClose = true) => {
    if (didClose) setShowPortalModal(false);
  };

  const handleDirectoryClick = (e: React.MouseEvent, maskedName: string, num: string, realService: string) => {
    if (uatProfile.isUatMode) {
      e.preventDefault();
      React.startTransition(() => {
        setSimulatedCallModal({ open: true, serviceName: maskedName, number: num, actualService: realService });
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#05080f] dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* ── TOP STATUS BAR & HERO HEADER ── */}
      <CalculatorHeroHeader
        currentTime={currentTime}
        loadshedding={loadshedding}
        telemetry={telemetry}
        theme={theme}
        activeTab={activeTab}
        onToggleTheme={toggleTheme}
        onCrestClick={handleCrestClick}
        onOpenBriefing={onOpenBriefing}
        onSelectTab={handleSelectTab}
      />

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4" aria-live="polite">
        <div className="rounded-2xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/90 dark:bg-sky-950/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 mt-0.5 text-sky-700 dark:text-sky-400 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {locationStatus === "locating"
                  ? "Detecting your municipal supply area…"
                  : liveLocation
                  ? liveLocation.areaName
                  : "Location is not available yet"}
              </p>
              <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                {liveLocation
                  ? `${selectedMuni.name} selected for ${liveLocation.province}; tariff and outage information now follows this detected area.`
                  : "Allow device location to select the relevant municipality, tariff, water and outage information. No Johannesburg default is applied."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refreshLiveLocation()}
            className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-xl border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 px-3 py-2 font-bold text-sky-800 dark:text-sky-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${locationStatus === "locating" ? "animate-spin" : ""}`} />
            <span>{locationStatus === "locating" ? "Locating" : "Use my location"}</span>
          </button>
        </div>
      </section>

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <main className={`flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 ${isSidebarOpen ? "lg:grid-cols-[1fr_360px]" : "lg:grid-cols-[1fr_56px]"} gap-6`}>
        <div className="space-y-4">
          {activeTab === "electricity" && (
            <>
              {/* Loadshedding Status Banner */}
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl px-4 py-3 text-xs text-amber-950 dark:text-amber-200">
                <Zap className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5 fill-amber-600 dark:fill-amber-400" aria-hidden="true" />
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    {loadshedding.stage > 0 ? `Stage ${loadshedding.stage} Loadshedding Active.` : "National Grid Normal · Loadshedding Suspended."}
                  </span>{" "}
                  {loadshedding.stage > 0 ? (
                    <>Next scheduled outage in {loadshedding.area}: <span className="font-mono font-bold">{loadshedding.nextSlot}</span>. </>
                  ) : (
                    <>No outages currently active for residential municipal meters. </>
                  )}
                  <a
                    href={loadshedding.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800 dark:text-amber-300 underline decoration-amber-600 dark:decoration-amber-400 hover:text-amber-950 dark:hover:text-amber-100 font-semibold inline-flex items-center gap-0.5"
                  >
                    <span>Check full schedule on Eskom</span>
                    <span aria-hidden="true"> →</span>
                  </a>
                </div>
              </div>

              {/* Purchase Calculator Form Card */}
              <CalculatorFormCard
                selectedMuni={selectedMuni}
                meterNumber={meterNumber}
                amount={amount}
                onSelectMuni={setSelectedMuni}
                onChangeMeterNumber={setMeterNumber}
                onChangeAmount={setAmount}
                onSelectPreset={(preset) => { setAmount(preset); setResult(null); }}
                onSubmit={handleCalculate}
              />

              {/* Calculated Result Card */}
              {result && (
                <CalculatorResultCard
                  result={result}
                  selectedMuni={selectedMuni}
                  amount={amount}
                  tokenCopied={tokenCopied}
                  onCopyToken={handleCopyToken}
                  onReset={handleReset}
                  onOpenStsDiagnostic={() => setShowStsErrorModal(true)}
                />
              )}

              {/* Household Appliance Consumption Benchmark Matrix */}
              <ApplianceBenchmarkTable
                selectedMuni={selectedMuni}
                onOpenAuditTab={(tab) => setActiveTab(tab)}
              />

              {/* Educational Knowledge Hub Accordions */}
              <EducationalAccordions ratePerKwh={selectedMuni.ratePerKwh} />
            </>
          )}

          {activeTab === "water" && <WaterConservationSection />}
          {activeTab === "energy" && <EnergySavingsAuditSection ratePerKwh={selectedMuni.ratePerKwh} />}
          {activeTab === "solar" && <SolarPaybackSection />}
          {activeTab === "sts_guide" && <StsMeterGuideSection />}
        </div>

        {/* ── SIDEBAR ADVISORIES & EMERGENCY DIRECTORY ── */}
        <CalculatorSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((open) => !open)}
          selectedMuni={selectedMuni}
          loadshedding={loadshedding}
          uatProfile={uatProfile}
          onOpenPortalModal={() => setShowPortalModal(true)}
          onOpenTab={handleSelectTab}
          onDirectoryClick={handleDirectoryClick}
        />
      </main>

      {/* ── FOOTER ── */}
      <CalculatorFooter
        onSelectTab={handleSelectTab}
        onOpenPortalModal={() => setShowPortalModal(true)}
        onOpenBriefing={onOpenBriefing}
      />

      {/* ── MODALS ── */}
      <StsError30Terminal
        isOpen={showStsErrorModal}
        onClose={() => setShowStsErrorModal(false)}
        meterNumber={meterNumber}
        municipalityName={selectedMuni.name}
      />

      <UtilityCheatSheetModal
        isOpen={showPortalModal}
        onClose={handlePortalClose}
        onUnlockSafeHaven={onUnlockSafeHaven}
      />

      <UatSimulatedCallModal
        isOpen={simulatedCallModal.open}
        serviceName={simulatedCallModal.serviceName}
        number={simulatedCallModal.number}
        actualService={simulatedCallModal.actualService}
        onClose={() => setSimulatedCallModal({ ...simulatedCallModal, open: false })}
      />

      {/* Bidirectional viewport boundary control */}
      <button
        type="button"
        onClick={scrollToBoundary}
        className="fixed bottom-6 right-6 z-40 p-3 bg-slate-900/95 hover:bg-slate-800 text-sky-400 hover:text-white border border-sky-500/40 hover:border-sky-400 rounded-full shadow-2xl shadow-black/80 backdrop-blur-md transition-all duration-200 active:scale-95 flex items-center justify-center group cursor-pointer"
        aria-label={scrollDirection === "down" ? "Scroll to bottom of page" : "Scroll to top of page"}
        title={scrollDirection === "down" ? "Scroll to bottom" : "Back to top"}
      >
        {scrollDirection === "down" ? (
          <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" aria-hidden="true" />
        ) : (
          <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
        )}
      </button>

      {/* CSS-only marquee keyframe */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
