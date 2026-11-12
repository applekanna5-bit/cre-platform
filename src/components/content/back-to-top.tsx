"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./article.module.css";
import { backToTopScrollBehavior, shouldShowBackToTop } from "./back-to-top-behavior";

const overlapSelectors = "a,button,input,select,textarea,summary,nav,footer,h1,h2,h3,h4,h5,h6,table,[role='button'],[role='region'],[role='dialog'],[aria-modal='true']";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateVisibility = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const points = [
        [rect.left + 4, rect.top + 4],
        [rect.right - 4, rect.top + 4],
        [rect.left + 4, rect.bottom - 4],
        [rect.right - 4, rect.bottom - 4],
        [rect.left + rect.width / 2, rect.top + rect.height / 2],
      ];
      const protectedSelectors = overlapSelectors;
      const overlapsContent = points.some(([x, y]) => {
        // Inspect beneath the button even while it is visible, avoiding overlap flicker.
        const target = document.elementsFromPoint(x, y).find(element => !button.contains(element));
        return target !== undefined && target.closest(protectedSelectors) !== null;
      });
      const remainingDocumentHeight = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      const shouldShow = shouldShowBackToTop(window.scrollY, remainingDocumentHeight, overlapsContent);
      if (!shouldShow && document.activeElement === button) {
        document.getElementById("main-content")?.focus({ preventScroll: true });
      }
      setVisible(shouldShow);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={visible ? styles.backToTop : styles.backToTop + " " + styles.backToTopHidden}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={() => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: backToTopScrollBehavior(prefersReducedMotion) });
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M12 19V5m0 0L5.5 11.5M12 5l6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
