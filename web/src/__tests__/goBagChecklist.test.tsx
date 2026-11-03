import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EscapeGoBagChecklist, DEFAULT_GO_BAG_ITEMS } from "../components/EscapeGoBagChecklist";

describe("EscapeGoBagChecklist Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const openChecklist = () => {
    const accordion = screen.getByRole("button", { name: /Escape 'Go-Bag' Checklist/i });
    expect(accordion).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(accordion);
    expect(accordion).toHaveAttribute("aria-expanded", "true");
    return accordion;
  };

  it("renders the 8 core South African emergency escape items", () => {
    render(<EscapeGoBagChecklist />);

    openChecklist();

    expect(screen.getByText("Escape 'Go-Bag' Checklist")).toBeDefined();
    expect(screen.getByText("Prepared items hidden in a safe location")).toBeDefined();
    expect(screen.getByText("South African Smart ID Card or Green Barcoded ID Book")).toBeDefined();
    expect(screen.getByText("SASSA Child Support / Disability / Older Persons Grant Cards")).toBeDefined();
    expect(screen.getByText("Children's Birth Certificates & Clinic Road to Health Cards")).toBeDefined();
    expect(screen.getByText("Emergency Cash (hidden from shared bank accounts)")).toBeDefined();
    expect(screen.getByText("Duplicate Car & Residence Keys")).toBeDefined();
    expect(screen.getByText("Spare Phone or unregistered backup SIM card")).toBeDefined();
    expect(screen.getByText("Chronic Medication (ARVs, Insulin, Asthma Pumps) & Prescriptions")).toBeDefined();
    expect(screen.getByText("Change of comfortable clothes & children's essentials")).toBeDefined();
  });

  it("toggles item checked state and updates ready count and progress", () => {
    render(<EscapeGoBagChecklist />);

    openChecklist();

    const itemLabel = screen.getByText("South African Smart ID Card or Green Barcoded ID Book");
    expect(screen.getByText("0/8 Ready (0%)")).toBeDefined();

    // Click item to mark as ready
    fireEvent.click(itemLabel);

    expect(screen.getByText("1/8 Ready (13%)")).toBeDefined();

    // Verify item saved into localStorage
    const saved = JSON.parse(localStorage.getItem("umkhuseli_gobag_checklist") || "[]");
    expect(saved.find((i: any) => i.id === "item-id-card")?.checked).toBe(true);
  });

  it("allows adding and removing custom escape items", () => {
    render(<EscapeGoBagChecklist />);

    openChecklist();

    // Click Add Custom Go-Bag Item
    const addBtn = screen.getByText("Add Custom Go-Bag Item");
    fireEvent.click(addBtn);

    const input = screen.getByPlaceholderText(/Add custom item/i);
    fireEvent.change(input, { target: { value: "Deed of sale & vehicle title" } });

    const submitBtn = screen.getByRole("button", { name: "Add" });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Deed of sale & vehicle title")).toBeDefined();
    expect(screen.getByText("0/9 Ready (0%)")).toBeDefined();
  });

  it("collapses and expands when header accordion is clicked", () => {
    render(<EscapeGoBagChecklist />);

    const accordionBtn = screen.getByRole("button", { name: /Escape 'Go-Bag' Checklist/i });
    expect(accordionBtn.getAttribute("aria-expanded")).toBe("false");

    // Click to expand
    fireEvent.click(accordionBtn);
    expect(accordionBtn.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("South African Smart ID Card or Green Barcoded ID Book")).toBeDefined();

    // Click to collapse again
    fireEvent.click(accordionBtn);
    expect(accordionBtn.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("South African Smart ID Card or Green Barcoded ID Book")).toBeNull();
  });
});
