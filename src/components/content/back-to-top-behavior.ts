export const BACK_TO_TOP_THRESHOLD = 450;
export const BACK_TO_TOP_FOOTER_CLEARANCE = 72;

export function shouldShowBackToTop(scrollY: number, remainingDocumentHeight = Number.POSITIVE_INFINITY, overlapsContent = false) {
  return scrollY > BACK_TO_TOP_THRESHOLD && remainingDocumentHeight > BACK_TO_TOP_FOOTER_CLEARANCE && !overlapsContent;
}

export function backToTopScrollBehavior(prefersReducedMotion: boolean): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}
