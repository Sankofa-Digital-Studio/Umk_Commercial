import React, { useEffect, useState } from "react";
import { Copy, PhoneCall, ShieldCheck, X } from "lucide-react";
import { THUTHUZELA_CENTERS, sortCentresByDistance } from "../data/saSafetyData";
import { getCachedLiveLocation } from "../services/liveLocationService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ussdCode?: string;
  serviceTitle?: string;
}

export const UssdSimulationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  ussdCode = "*120*7867#",
  serviceTitle = "TEARS Foundation Helpline",
}) => {
  const [userInput, setUserInput] = useState("");
  const [screenStep, setScreenStep] = useState<"menu" | "response">("menu");
  const [responseMessage, setResponseMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const isUssdCode = ussdCode.trim().startsWith("*");

  useEffect(() => {
    if (!isOpen) return;
    setUserInput("");
    setScreenStep("menu");
    setResponseMessage("");
    setCopied(false);
  }, [isOpen, ussdCode]);

  if (!isOpen) return null;

  const handleSend = () => {
    const trimmed = userInput.trim();
    if (trimmed === "1") {
      setResponseMessage(
        "🚨 Emergency Alert Initiated.\nA priority callback request has been queued at the National GBV Command Centre. A dedicated social worker will call your device immediately free of charge."
      );
      setScreenStep("response");
    } else if (trimmed === "2") {
      const cached = getCachedLiveLocation();
      const nearest = cached
        ? sortCentresByDistance(THUTHUZELA_CENTERS, cached.lat, cached.lng)[0]
        : null;
      setResponseMessage(
        nearest
          ? `📍 Nearest 24/7 Safe Haven:\n${nearest.name}\n${nearest.address}\nDirect line: ${nearest.contactNumber}.\nOpen 24/7 with forensic & trauma support.`
          : "📍 Live location is not available. Open the Centres tab to choose your province or enable device location for a nearest-centre result."
      );
      setScreenStep("response");
    } else if (trimmed === "3") {
      setResponseMessage(
        "📚 Speak-Up Educational Guidance:\nUnder Section 4(4) of the Domestic Violence Act, court clerks must assist you with Form 2 for free. Legal Aid: 0800 110 110."
      );
      setScreenStep("response");
    } else {
      setResponseMessage(
        `✓ Request received for option "${trimmed || "Direct Callback"}".\nUSSD session zero-rated across Vodacom, MTN, Telkom & Cell C. Callback dispatched.`
      );
      setScreenStep("response");
    }
  };

  const handleReset = () => {
    setUserInput("");
    setScreenStep("menu");
    onClose();
  };

  const responseLines = responseMessage.split("\n");

  return (
    <div
      data-testid="ussd-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden font-mono text-slate-200">
        {/* Retro Telco USSD Header */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white tracking-wider">{ussdCode}</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">
            ZERO AIRTIME
          </span>
        </div>

        {/* USSD Screen Body */}
        <div className="p-5 space-y-4 text-xs">
          {!isUssdCode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <PhoneCall className="w-4 h-4" />
                <span>In-app lifeline contact</span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                <strong className="text-white">{serviceTitle}</strong> is ready at the toll-free number below. The contact remains visible in Safe Haven until you choose to open the phone dialler.
              </p>
              <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 p-4 text-center">
                <span className="text-lg font-black tracking-wider text-emerald-300">{ussdCode}</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard?.writeText(ussdCode);
                  setCopied(true);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? "Number copied" : "Copy number without leaving Safe Haven"}</span>
              </button>
            </div>
          ) : screenStep === "menu" ? (
            <>
              <div className="space-y-2 text-slate-100 font-medium">
                <p className="font-bold text-amber-400">Welcome to {serviceTitle}</p>
                <p className="text-slate-300">Select an option:</p>
                <p>1. Emergency: Get Help</p>
                <p>2. Find your nearest centre</p>
                <p>3. Speak-Up Educational Vids / Rights</p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={5}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter 1, 2, or 3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>USSD Session Response</span>
              </div>
              <div className="text-slate-200 whitespace-pre-line text-xs leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                {responseLines.map((line, index) => {
                  const isTccLine = line.trim() === "Chris Hani Baragwanath TCC";
                  return isTccLine ? (
                    <p key={`${line}-${index}`} className="text-slate-100 font-bold">
                      {line}
                    </p>
                  ) : (
                    <p key={`${line}-${index}`}>{line}</p>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* USSD Modal Actions */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors uppercase tracking-wider"
          >
            Cancel
          </button>
          {!isUssdCode ? (
            <a
              href={`tel:${ussdCode.replace(/\s/g, "")}`}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors uppercase tracking-wider shadow"
            >
              Open phone dialler
            </a>
          ) : screenStep === "menu" ? (
            <button
              type="button"
              onClick={handleSend}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors uppercase tracking-wider shadow"
            >
              Send
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors uppercase tracking-wider shadow"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
