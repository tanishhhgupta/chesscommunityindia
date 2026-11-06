import { useEffect } from "react";

/**
 * Apple-inspired scroll reveal hook
 * Utilizes high-performance IntersectionObserver and MutationObserver to trigger
 * smooth Apple-grade progressive reveals and scroll-linked entrance animations.
 * Fully honors the `prefers-reduced-motion` accessibility standard.
 */
export function useAppleScrollReveal(activeView?: string) {
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // If user prefers reduced motion, reveal all elements immediately without transforms
    if (prefersReducedMotion) {
      document.querySelectorAll(".apple-scroll-reveal, .apple-scroll-float").forEach((el) => {
        el.classList.add("is-revealed");
      });
      return;
    }

    const observerCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.08,
    });

    const scanAndObserve = () => {
      const elements = document.querySelectorAll(
        ".apple-scroll-reveal:not(.is-revealed), .apple-scroll-float:not(.is-revealed)"
      );

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // If element is already above or within the viewport fold, reveal immediately
        if (rect.top < window.innerHeight * 0.95) {
          el.classList.add("is-revealed");
        } else {
          observer.observe(el);
        }
      });
    };

    // Immediate scan
    scanAndObserve();

    // Settle scan after microtask / layout pass
    const timer = setTimeout(scanAndObserve, 80);

    // Watch for dynamic view switches or component renders
    const mutationObserver = new MutationObserver(() => {
      scanAndObserve();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("scroll", scanAndObserve, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", scanAndObserve);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [activeView]);
}
