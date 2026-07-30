import { driver, type Driver } from "driver.js";

// Singleton driver so multiple startTour() calls don't create overlapping
// popovers. Each call destroys the previous and starts fresh.
let instance: Driver | null = null;

const COMMON_CONFIG = {
  animate: true,
  overlayOpacity: 0.55,
  stagePadding: 8,
  stageRadius: 10,
  popoverOffset: 12,
  allowClose: true,
  allowKeyboardControl: true,
  showProgress: true,
  progressText: "{{current}} de {{total}}",
  nextBtnText: "Siguiente",
  prevBtnText: "Atrás",
  doneBtnText: "Listo",
  // CSS overrides live in globals.css under .driver-popover.
} as const;

export function getDriver(): Driver {
  if (!instance) {
    instance = driver(COMMON_CONFIG);
  }
  return instance;
}

export function destroyDriver(): void {
  if (instance?.isActive()) {
    instance.destroy();
  }
  instance = null;
}