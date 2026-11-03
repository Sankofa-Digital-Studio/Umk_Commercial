import React, { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, MapPin, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { DISGUISE_CATALOG, DISGUISE_SEQUENCE_MAP, DisguiseType, getDisguiseUrl } from "../services/disguiseManager";
import { IceContact, UatProfile } from "../services/uatProfileService";

export type SurvivorSetupSection = "profile" | "ice" | "permissions";

interface Props {
  isOpen: boolean;
  section: SurvivorSetupSection;
  isFirstTime?: boolean;
  profile: UatProfile;
  onClose: () => void;
  onSave: (profile: UatProfile) => Promise<void>;
  permissionsStatus: {
    geolocation: "granted" | "prompt" | "denied" | "unknown";
    storage: "persisted" | "not_persisted" | "unknown";
    notifications: "granted" | "default" | "denied" | "unsupported" | "unknown";
  };
  onRequestLocation: () => void;
  onRequestStorage: () => void;
  onRequestNotifications: () => void;
}

const SECTION_ORDER: SurvivorSetupSection[] = ["profile", "ice", "permissions"];

export const SurvivorSetupModal: React.FC<Props> = ({
  isOpen,
  section,
  isFirstTime = false,
  profile,
  onClose,
  onSave,
  permissionsStatus,
  onRequestLocation,
  onRequestStorage,
  onRequestNotifications,
}) => {
  const [activeSection, setActiveSection] = useState<SurvivorSetupSection>(section);
  const [draft, setDraft] = useState<UatProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactRelationship, setContactRelationship] = useState("Trusted friend");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setActiveSection(section);
    setDraft(profile);
    setError(null);
  }, [isOpen, section, profile]);

  const currentIndex = SECTION_ORDER.indexOf(activeSection);
  const canCompleteProfile = draft.personal.fullName.trim().length >= 2 && (draft.personal.safeWord || "").trim().length >= 3;
  const canCompleteIce = draft.contacts.length > 0;
  const faceSequence = useMemo(
    () => Object.entries(DISGUISE_SEQUENCE_MAP).find(([, face]) => face === draft.preferredDisguise)?.[0],
    [draft.preferredDisguise]
  );

  if (!isOpen) return null;

  const persist = async (nextDraft: UatProfile) => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(nextDraft);
      setDraft(nextDraft);
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save your setup securely.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveAndContinue = async () => {
    if (activeSection === "profile" && !canCompleteProfile) {
      setError("Enter a non-default name or safe alias and a private safe word before continuing.");
      return;
    }
    if (activeSection === "ice" && !canCompleteIce) {
      setError("Add at least one trusted ICE contact before continuing.");
      return;
    }

    const isFinalStep = activeSection === "permissions";
    const nextDraft = isFinalStep
      ? { ...draft, onboardingCompleted: canCompleteProfile && canCompleteIce }
      : draft;
    if (!(await persist(nextDraft))) return;

    // Close after every successful remote write. The dashboard completion gate
    // re-evaluates persisted state and deliberately routes the next step.
    onClose();
  };

  const addContact = () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      setError("ICE contact name and mobile number are required.");
      return;
    }
    if (draft.contacts.length >= 5) {
      setError("A maximum of five ICE contacts can be registered.");
      return;
    }
    const contact: IceContact = {
      id: crypto.randomUUID(),
      name: contactName.trim(),
      relationship: contactRelationship.trim() || "Trusted contact",
      phone: contactPhone.trim(),
      email: contactEmail.trim(),
      isPrimary: draft.contacts.length === 0,
    };
    setDraft((current) => ({ ...current, contacts: [...current.contacts, contact] }));
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setError(null);
  };

  const title = activeSection === "profile"
    ? "Survivor profile and preferred face"
    : activeSection === "ice"
    ? "Trusted ICE contacts"
    : "Device safety permissions";

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="survivor-setup-title"
        className="w-full max-w-lg max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-800 bg-slate-950/95 p-5 backdrop-blur">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
              {isFirstTime ? `First-time setup · Step ${currentIndex + 1} of 3` : "Safety settings"}
            </p>
            <h2 id="survivor-setup-title" className="mt-1 text-lg font-black text-white">{title}</h2>
          </div>
          {!isFirstTime && (
            <button type="button" onClick={onClose} aria-label="Close setup" className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          )}
        </header>

        {isFirstTime && (
          <div className="grid grid-cols-3 gap-2 px-5 pt-5" aria-label="Setup progress">
            {SECTION_ORDER.map((item, index) => (
              <div key={item} className={`h-1.5 rounded-full ${index <= currentIndex ? "bg-amber-400" : "bg-slate-800"}`} />
            ))}
          </div>
        )}

        <div className="space-y-5 p-5">
          {activeSection === "profile" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-300">
                  Name or safe alias
                  <input
                    value={draft.personal.fullName}
                    onChange={(event) => setDraft((current) => ({ ...current, personal: { ...current.personal, fullName: event.target.value } }))}
                    autoComplete="name"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-amber-400"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-300">
                  Safe word
                  <input
                    value={draft.personal.safeWord || ""}
                    onChange={(event) => setDraft((current) => ({ ...current, personal: { ...current.personal, safeWord: event.target.value.toUpperCase() } }))}
                    autoComplete="off"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 font-mono text-sm uppercase text-amber-200 outline-none focus:border-amber-400"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-300 sm:col-span-2">
                  Medical notes or allergies (optional)
                  <textarea
                    value={draft.personal.medicalConditions || ""}
                    onChange={(event) => setDraft((current) => ({ ...current, personal: { ...current.personal, medicalConditions: event.target.value } }))}
                    rows={2}
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-amber-400"
                  />
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Choose the most convenient face</h3>
                    <p className="mt-0.5 text-[11px] text-slate-400">Each face loads from the same ishekomberera.vercel.app origin.</p>
                  </div>
                  <span className="rounded-lg bg-slate-900 px-2 py-1 font-mono text-xs text-amber-300">{faceSequence}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.values(DISGUISE_CATALOG) as typeof DISGUISE_CATALOG[DisguiseType][]).map((face, index) => {
                    const selected = draft.preferredDisguise === face.id;
                    return (
                      <button
                        key={face.id}
                        type="button"
                        onClick={() => setDraft((current) => ({ ...current, preferredDisguise: face.id }))}
                        className={`rounded-2xl border p-3 text-left transition ${selected ? "border-amber-400 bg-amber-400/10" : "border-slate-800 bg-slate-900 hover:border-slate-600"}`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-white">{index + 1}. {face.name}</span>
                          {selected && <Check className="h-4 w-4 text-amber-400" />}
                        </span>
                        <span className="mt-1 block text-[10px] leading-relaxed text-slate-400">{face.description}</span>
                        <a
                          href={getDisguiseUrl(face.id)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300"
                        >
                          Preview face {index + 1} <ExternalLink className="h-3 w-3" />
                        </a>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeSection === "ice" && (
            <>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-100">
                Add one trusted person to complete setup; up to five can be registered. No demonstration contacts are preloaded.
              </div>
              <div className="space-y-2">
                {draft.contacts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-400">No ICE contacts saved yet.</div>
                ) : draft.contacts.map((contact, index) => (
                  <div key={contact.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{index + 1}. {contact.name}</p>
                      <p className="truncate text-[11px] text-slate-400">{contact.relationship} · {contact.phone}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${contact.name}`}
                      onClick={() => setDraft((current) => ({ ...current, contacts: current.contacts.filter((item) => item.id !== contact.id) }))}
                      className="rounded-lg p-2 text-slate-500 hover:bg-rose-950 hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {draft.contacts.length < 5 && (
                <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2">
                  <input aria-label="ICE contact name" placeholder="Trusted contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
                  <input aria-label="ICE relationship" placeholder="Relationship" value={contactRelationship} onChange={(e) => setContactRelationship(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
                  <input aria-label="ICE mobile number" type="tel" placeholder="Mobile number" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
                  <input aria-label="ICE email address" type="email" placeholder="Email (optional)" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
                  <button type="button" onClick={addContact} className="rounded-xl bg-amber-500 p-3 text-xs font-black text-slate-950 sm:col-span-2">Add ICE contact</button>
                </div>
              )}
            </>
          )}

          {activeSection === "permissions" && (
            <div className="space-y-3">
              <PermissionRow icon={<MapPin className="h-5 w-5" />} title="Live location" status={permissionsStatus.geolocation} onClick={onRequestLocation} action="Enable location" />
              <PermissionRow icon={<ShieldCheck className="h-5 w-5" />} title="Durable device storage" status={permissionsStatus.storage} onClick={onRequestStorage} action="Protect local vault" />
              <PermissionRow icon={<Users className="h-5 w-5" />} title="Discreet notifications" status={permissionsStatus.notifications} onClick={onRequestNotifications} action="Choose notification access" />
              <p className="text-[11px] leading-relaxed text-slate-400">Permission denial does not block Safe Haven. You can revisit these controls from Safety Plan at any time.</p>
            </div>
          )}

          {error && <div role="alert" className="rounded-xl border border-rose-700 bg-rose-950/60 p-3 text-xs text-rose-200">{error}</div>}

          <div className="flex gap-2 border-t border-slate-800 pt-4">
            {isFirstTime && currentIndex > 0 && (
              <button type="button" onClick={() => setActiveSection(SECTION_ORDER[currentIndex - 1])} className="rounded-xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-300">Back</button>
            )}
            <button
              type="button"
              onClick={saveAndContinue}
              disabled={isSaving}
              className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-xs font-black text-slate-950 disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? "Saving securely…" : isFirstTime && activeSection !== "permissions" ? "Save and continue" : activeSection === "permissions" ? "Complete safety setup" : "Save changes"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const PermissionRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  status: string;
  action: string;
  onClick: () => void;
}> = ({ icon, title, status, action, onClick }) => {
  const complete = status === "granted" || status === "persisted";
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center gap-3">
        <span className={complete ? "text-emerald-400" : "text-slate-400"}>{complete ? <Check className="h-5 w-5" /> : icon}</span>
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">{status.replaceAll("_", " ")}</p>
        </div>
      </div>
      <button type="button" onClick={onClick} className="rounded-lg bg-slate-800 px-3 py-2 text-[10px] font-bold text-slate-200 hover:bg-slate-700">{action}</button>
    </div>
  );
};
