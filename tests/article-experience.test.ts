import { BACK_TO_TOP_FOOTER_CLEARANCE, BACK_TO_TOP_THRESHOLD, backToTopScrollBehavior, shouldShowBackToTop } from "@/components/content/back-to-top-behavior";
import { describe, expect, it } from "vitest";

describe("article reading controls", () => {
  it("keeps the floating control hidden through the 450px threshold", () => {
    expect(shouldShowBackToTop(0)).toBe(false);
    expect(shouldShowBackToTop(BACK_TO_TOP_THRESHOLD)).toBe(false);
    expect(shouldShowBackToTop(BACK_TO_TOP_THRESHOLD + 1)).toBe(true);
    expect(shouldShowBackToTop(900, Number.POSITIVE_INFINITY, true)).toBe(false);
  });

  it("keeps the control out of the footer's lower control area", () => {
    expect(shouldShowBackToTop(900, BACK_TO_TOP_FOOTER_CLEARANCE)).toBe(false);
    expect(shouldShowBackToTop(900, BACK_TO_TOP_FOOTER_CLEARANCE + 1)).toBe(true);
  });

  it("uses smooth scrolling unless reduced motion is requested", () => {
    expect(backToTopScrollBehavior(false)).toBe("smooth");
    expect(backToTopScrollBehavior(true)).toBe("auto");
  });
});
