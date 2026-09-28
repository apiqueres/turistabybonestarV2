/** Small shared helpers for the motion layer (client only). */

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isMobile(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

const loadState = { loaded: false };
const listeners: Array<() => void> = [];

/** Called by the loader once the intro is finished. */
export function markLoaded() {
  if (loadState.loaded) return;
  loadState.loaded = true;
  listeners.splice(0).forEach((cb) => cb());
  window.dispatchEvent(new CustomEvent("tb:loaded"));
}

/** Runs `cb` after the loader finished (immediately if it already did). Returns an unsubscribe. */
export function onLoaded(cb: () => void): () => void {
  if (loadState.loaded) {
    cb();
    return () => {};
  }
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}
