import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Auto-optimize: lazy-load all images that don't have an explicit loading
// strategy. Improves Time-to-Interactive on mobile (the feed loads many photos).
// Also sets decoding="async" so image decoding happens off the main thread.
if (typeof window !== "undefined" && typeof MutationObserver !== "undefined") {
  const enhanceImg = (img) => {
    if (img && img.tagName === "IMG") {
      if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("img").forEach(enhanceImg);
  });
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (n && n.nodeType === 1) {
          if (n.tagName === "IMG") enhanceImg(n);
          else if (n.querySelectorAll) n.querySelectorAll("img").forEach(enhanceImg);
        }
      });
    }
  });
  try {
    obs.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {
    // ignore
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
