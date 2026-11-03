import React, { useState } from "react";
import { Scale, ChevronDown, ChevronUp, ShieldCheck, AlertCircle, FileText } from "lucide-react";

interface SouthAfricanLegalRightsProps {
  onOpenLifeline?: (dialString: string, title: string) => void;
}

export const SouthAfricanLegalRights: React.FC<SouthAfricanLegalRightsProps> = ({ onOpenLifeline }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      data-testid="sa-legal-rights-card"
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/40 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Your Rights Under South African Law</h3>
            <p className="text-xs text-amber-400/90 font-medium mt-0.5">
              Domestic Violence Act 116 of 1998 & Amendment Act 2021
            </p>
          </div>
        </div>
        <div className="text-slate-400 p-1">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-2 space-y-3.5 border-t border-slate-800/80 animate-in fade-in duration-150 text-xs">
          {/* Right 1 */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                1
              </span>
              <h4 className="font-bold text-white text-xs">
                You don't need a lawyer to get a Protection Order
              </h4>
            </div>
            <p className="text-slate-300 text-[11.5px] leading-relaxed pl-7">
              Go to your nearest Magistrates Court. The Clerk of the Court is legally required to
              assist you in completing Form 2 free of charge. You do not need to pay any legal fees
              or employ an attorney.
            </p>
          </div>

          {/* Right 2 */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                2
              </span>
              <h4 className="font-bold text-white text-xs">
                Interim Protection Orders are immediate
              </h4>
            </div>
            <p className="text-slate-300 text-[11.5px] leading-relaxed pl-7">
              If you face imminent danger, the magistrate can issue an Interim Protection Order the
              very same day without the respondent (abuser) present (ex parte). The order takes
              effect immediately once served by the SAPS or sheriff.
            </p>
          </div>

          {/* Right 3 */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                3
              </span>
              <h4 className="font-bold text-white text-xs">
                Suspended Warrant of Arrest is automatic
              </h4>
            </div>
            <p className="text-slate-300 text-[11.5px] leading-relaxed pl-7">
              Every protection order issued in South Africa includes a suspended warrant of arrest.
              If the perpetrator violates ANY term or condition of the order, you can hand the
              warrant directly to SAPS for immediate arrest without waiting for a new hearing.
            </p>
          </div>

          {/* Additional Statutory Notice */}
          <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/40 flex items-start gap-2.5 text-[11px] text-sky-200">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              <strong>Legal Aid South Africa:</strong> If you need representation for contested final hearings, use the in-app contacts: {" "}
              <button
                type="button"
                onClick={() => onOpenLifeline?.("0800110110", "Legal Aid South Africa — Toll-Free")}
                className="font-bold underline text-sky-300"
              >
                0800 110 110
              </button>{" "}
              or {" "}
              <button
                type="button"
                onClick={() => onOpenLifeline?.("0798357179", "Legal Aid South Africa — Please Call Me")}
                className="font-bold underline text-sky-300"
              >
                Please Call Me: 079 835 7179
              </button>.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
