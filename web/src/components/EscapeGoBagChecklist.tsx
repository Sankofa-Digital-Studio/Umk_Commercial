import React, { useState, useEffect } from "react";
import { Briefcase, ChevronDown, ChevronUp, Check, Plus, Trash2, RotateCcw } from "lucide-react";

export interface GoBagItem {
  id: string;
  label: string;
  checked: boolean;
  isCustom?: boolean;
}

const STORAGE_KEY = "umkhuseli_gobag_checklist";

export const DEFAULT_GO_BAG_ITEMS: GoBagItem[] = [
  {
    id: "item-id-card",
    label: "South African Smart ID Card or Green Barcoded ID Book",
    checked: false,
  },
  {
    id: "item-sassa",
    label: "SASSA Child Support / Disability / Older Persons Grant Cards",
    checked: false,
  },
  {
    id: "item-birth-certificates",
    label: "Children's Birth Certificates & Clinic Road to Health Cards",
    checked: false,
  },
  {
    id: "item-emergency-cash",
    label: "Emergency Cash (hidden from shared bank accounts)",
    checked: false,
  },
  {
    id: "item-keys",
    label: "Duplicate Car & Residence Keys",
    checked: false,
  },
  {
    id: "item-spare-phone",
    label: "Spare Phone or unregistered backup SIM card",
    checked: false,
  },
  {
    id: "item-medication",
    label: "Chronic Medication (ARVs, Insulin, Asthma Pumps) & Prescriptions",
    checked: false,
  },
  {
    id: "item-clothes",
    label: "Change of comfortable clothes & children's essentials",
    checked: false,
  },
];

export const EscapeGoBagChecklist: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<GoBagItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        // Fallback to default
      }
    }
    return DEFAULT_GO_BAG_ITEMS;
  });

  const [newItemText, setNewItemText] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        // LocalStorage quota or disabled
      }
    }
  }, [items]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem: GoBagItem = {
      id: `custom-${Date.now()}`,
      label: newItemText.trim(),
      checked: false,
      isCustom: true,
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemText("");
    setShowAddInput(false);
  };

  const handleDeleteCustomItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetChecklist = () => {
    if (window.confirm("Reset all Go-Bag checklist items to uncompleted?")) {
      setItems((prev) => prev.map((item) => ({ ...item, checked: false })));
    }
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const progressPct = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  return (
    <div
      data-testid="escape-gobag-card"
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header Accordion Bar */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/40 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Escape 'Go-Bag' Checklist</h3>
              <span className="text-[10px] bg-emerald-950 border border-emerald-700/50 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full">
                {checkedCount}/{items.length} Ready ({progressPct}%)
              </span>
            </div>
            <p className="text-xs text-emerald-400/90 font-medium mt-0.5">
              Prepared items hidden in a safe location
            </p>
          </div>
        </div>
        <div className="text-slate-400 p-1">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-slate-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Checklist Content */}
      {isOpen && (
        <div className="p-4 pt-3 space-y-2.5 animate-in fade-in duration-150">
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 select-none ${
                  item.checked
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      item.checked
                        ? "bg-emerald-500 border-emerald-400 text-slate-950"
                        : "border-slate-600 bg-slate-900"
                    }`}
                  >
                    {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-xs leading-relaxed ${
                      item.checked ? "line-through text-slate-400" : "font-medium text-slate-200"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {item.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomItem(item.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Remove custom item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add custom item form */}
          {showAddInput ? (
            <form onSubmit={handleAddItem} className="flex gap-2 pt-1">
              <input
                type="text"
                autoFocus
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add custom item (e.g. Spare eyeglasses, deeds)..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddInput(false);
                  setNewItemText("");
                }}
                className="px-2.5 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowAddInput(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Go-Bag Item</span>
              </button>

              {checkedCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetChecklist}
                  className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1"
                  title="Uncheck all"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
