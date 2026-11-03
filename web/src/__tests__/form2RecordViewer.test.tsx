import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Form2CourtRecordViewerModal, CourtIncidentRecord } from "../components/Form2CourtRecordViewerModal";
import { SouthAfricanLegalRights } from "../components/SouthAfricanLegalRights";

// Mock ectaSection15Pdf
vi.mock("../services/ectaSection15Pdf", () => ({
  exportOrShareEctaAffidavitPdf: vi.fn().mockResolvedValue({
    filename: "Umkhuseli_Form2_ECTA15_test.pdf",
    sharedViaNative: false,
  }),
}));

describe("Form 2 Protection Order Court Record Viewer & Digital Signature", () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,mocksignature");
  });

  const sampleIncidents: CourtIncidentRecord[] = [
    {
      id: "inc-1",
      type: "Verbal & Threat of Harm",
      severity: 3,
      perpetrator: "Partner",
      location: "Shared residence (living room)",
      date: "24 Oct 2026, 08:49",
      statement: "The respondent threatened bodily harm and attempted to confiscate mobile phone.",
      injuriesOrImpact: "Severe psychological trauma",
      witnesses: "Sibling in adjacent bedroom",
      isEncrypted: true,
      sha256Checksum: "9b4f738a1099238e8bc2140d39e3845b5930219c8f00129ad89bcf21798e1042",
    },
    {
      id: "inc-2",
      type: "Economic Control & Financial Coercion",
      severity: 2,
      perpetrator: "Ex-partner",
      location: "Bank ATM / Shared Bank Account",
      date: "22 Oct 2026, 14:15",
      statement: "Perpetrator unlawfully seized bank cards and blocked SASSA grant access.",
      injuriesOrImpact: "Financial deprivation",
      witnesses: "None",
      isEncrypted: true,
      sha256Checksum: "c18a2283e589df4f25c4ef1823901a88910b7b25c4ef1823901aa4f89d31ec88",
    },
  ];

  it("renders incident details with severity, date, perpetrator, and encrypted statement when locked", () => {
    render(
      <Form2CourtRecordViewerModal
        isOpen={true}
        onClose={vi.fn()}
        incidents={sampleIncidents}
        isVaultUnlocked={false}
      />
    );

    expect(screen.getByText(/Form 2 Protection Order/i)).toBeDefined();
    expect(screen.getByText("Record 1 of 2")).toBeDefined();
    expect(screen.getByText("INCIDENT #1 OF 2")).toBeDefined();
    expect(screen.getByText("SEVERITY 3 / 5")).toBeDefined();
    expect(screen.getByText("Verbal & Threat of Harm")).toBeDefined();
    expect(screen.getByText("Partner")).toBeDefined();
    expect(screen.getByText("Shared residence (living room)")).toBeDefined();

    // Content Encrypted banner
    expect(screen.getByText(/Content Encrypted \(AES-256-GCM\)/i)).toBeDefined();
  });

  it("allows navigating between incident records using previous and next pagination buttons", () => {
    render(
      <Form2CourtRecordViewerModal
        isOpen={true}
        onClose={vi.fn()}
        incidents={sampleIncidents}
        isVaultUnlocked={true}
      />
    );

    expect(screen.getByText("Record 1 of 2")).toBeDefined();
    expect(screen.getByText("Verbal & Threat of Harm")).toBeDefined();

    // Click Next Incident
    const nextBtn = screen.getByTitle("Next Incident");
    fireEvent.click(nextBtn);

    expect(screen.getByText("Record 2 of 2")).toBeDefined();
    expect(screen.getByText("Economic Control & Financial Coercion")).toBeDefined();
    expect(screen.getByText("Ex-partner")).toBeDefined();

    // Click Previous Incident
    const prevBtn = screen.getByTitle("Previous Incident");
    fireEvent.click(prevBtn);

    expect(screen.getByText("Record 1 of 2")).toBeDefined();
    expect(screen.getByText("Verbal & Threat of Harm")).toBeDefined();
  });

  it("opens signature pad and captures electronic digital signature", () => {
    render(
      <Form2CourtRecordViewerModal
        isOpen={true}
        onClose={vi.fn()}
        incidents={sampleIncidents}
        isVaultUnlocked={true}
      />
    );

    const signBtn = screen.getByRole("button", { name: /Sign/i });
    fireEvent.click(signBtn);

    expect(screen.getByText(/Deponent Electronic Signature \(ECTA Sec 15\)/i)).toBeDefined();

    // Click Save Signature
    const saveSigBtn = screen.getByRole("button", { name: "Save Signature" });
    fireEvent.click(saveSigBtn);

    // Verify button updates to Signed
    expect(screen.getByRole("button", { name: /Signed/i })).toBeDefined();
  });

  it("triggers PDF export when Print / Export Court PDF button is clicked", async () => {
    const { exportOrShareEctaAffidavitPdf } = await import("../services/ectaSection15Pdf");

    render(
      <Form2CourtRecordViewerModal
        isOpen={true}
        onClose={vi.fn()}
        incidents={sampleIncidents}
        isVaultUnlocked={true}
      />
    );

    const exportBtn = screen.getByRole("button", { name: /Print \/ Export Court PDF/i });
    fireEvent.click(exportBtn);

    expect(exportOrShareEctaAffidavitPdf).toHaveBeenCalled();
  });
});

describe("SouthAfricanLegalRights Component", () => {
  it("renders the 3 statutory Domestic Violence Act 116 of 1998 legal safeguards", () => {
    render(<SouthAfricanLegalRights />);

    const legalRightsCard = screen.getByRole("button", { name: /Your Rights Under South African Law/i });
    expect(legalRightsCard).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(legalRightsCard);
    expect(legalRightsCard).toHaveAttribute("aria-expanded", "true");

    expect(screen.getByText("Your Rights Under South African Law")).toBeDefined();
    expect(screen.getByText(/Domestic Violence Act 116 of 1998/i)).toBeDefined();
    expect(screen.getByText("You don't need a lawyer to get a Protection Order")).toBeDefined();
    expect(screen.getByText("Interim Protection Orders are immediate")).toBeDefined();
    expect(screen.getByText("Suspended Warrant of Arrest is automatic")).toBeDefined();
  });
});
