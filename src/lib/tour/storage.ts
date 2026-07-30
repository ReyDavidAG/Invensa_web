const PREFIX = "invensa:tour:";

function isClient(): boolean {
  return typeof window !== "undefined";
}

// SSR-safe: when called during server render we pretend the tour was
// already completed so we never try to start one before hydration.
export function hasCompleted(tourId: string): boolean {
  if (!isClient()) return true;
  try {
    return localStorage.getItem(`${PREFIX}${tourId}`) === "1";
  } catch {
    // localStorage can throw in private mode on some browsers
    return false;
  }
}

export function markCompleted(tourId: string): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(`${PREFIX}${tourId}`, "1");
  } catch {
    // ignore — best-effort persistence
  }
}

export function resetAllTours(): void {
  if (!isClient()) return;
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}