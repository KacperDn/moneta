import { CSSProperties, useEffect } from "react";

const SELECTOR = "[data-reveal]";
const STAGGER_MS = 80;

/**
 * Spread onto an element to fade/slide it in when it scrolls into view.
 * Only use on elements whose className is static: React would drop the
 * `is-visible` class the observer adds if className changed between renders.
 */
export function revealProps(index = 0) {
  return {
    "data-reveal": "",
    style: { "--reveal-delay": `${index * STAGGER_MS}ms` } as CSSProperties,
  };
}

/**
 * Marks `[data-reveal]` elements `is-visible` once they enter the viewport.
 * A MutationObserver picks up elements mounted later (tab switches, data loads).
 * Mount once, near the app root.
 */
export function useScrollReveal(): void {
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    const observeWithin = (root: ParentNode) => {
      root.querySelectorAll(`${SELECTOR}:not(.is-visible)`).forEach(el => io.observe(el));
    };
    observeWithin(document);

    const mo = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR)) io.observe(node);
          observeWithin(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
