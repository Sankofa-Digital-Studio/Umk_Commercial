// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  EMPTY_UAT_PROFILE,
  getUatProfile,
  loadUatProfile,
} from "../services/uatProfileService";

describe("Survivor profile persistence boundary", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts without static survivor or ICE data", () => {
    expect(EMPTY_UAT_PROFILE.personal.fullName).toBe("");
    expect(EMPTY_UAT_PROFILE.contacts).toEqual([]);
    expect(EMPTY_UAT_PROFILE.socials.alertEmail).toBe("");
    expect(getUatProfile().contacts).toEqual([]);
  });

  it("removes legacy local profile PII instead of loading it", async () => {
    localStorage.setItem("pcalc_uat_profile", JSON.stringify({ personal: { fullName: "Seeded Person" } }));
    localStorage.setItem("umkhuseli_uat_ice_profile", "seeded-contact-data");
    localStorage.setItem("pcalc_survivor_onboarded", "true");

    const profile = await loadUatProfile();

    expect(profile.personal.fullName).toBe("");
    expect(profile.contacts).toEqual([]);
    expect(localStorage.getItem("pcalc_uat_profile")).toBeNull();
    expect(localStorage.getItem("umkhuseli_uat_ice_profile")).toBeNull();
    expect(localStorage.getItem("pcalc_survivor_onboarded")).toBeNull();
  });
});
