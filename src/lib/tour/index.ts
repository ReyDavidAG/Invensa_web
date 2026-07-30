import { destroyDriver, getDriver } from "./driver";
import { hasCompleted, markCompleted } from "./storage";
import type { Tour } from "./types";

import { account } from "./tours/account";
import { cashClosing } from "./tours/cash-closing";
import { customerEdit } from "./tours/customer-edit";
import { customerNew } from "./tours/customer-new";
import { customers } from "./tours/customers";
import { dashboard } from "./tours/dashboard";
import { forgotPassword } from "./tours/forgot-password";
import { login } from "./tours/login";
import { onboarding } from "./tours/onboarding";
import { productDetail } from "./tours/product-detail";
import { productEdit } from "./tours/product-edit";
import { productNew } from "./tours/product-new";
import { products } from "./tours/products";
import { register } from "./tours/register";
import { reports } from "./tours/reports";
import { resetPassword } from "./tours/reset-password";
import { saleDetail } from "./tours/sale-detail";
import { saleNew } from "./tours/sale-new";

export type { Tour } from "./types";

// Registry — onboarding first, then alphabetical by title.
export const TOURS: Tour[] = [
  onboarding,
  account,
  cashClosing,
  customerEdit,
  customerNew,
  customers,
  dashboard,
  forgotPassword,
  login,
  productDetail,
  productEdit,
  productNew,
  products,
  register,
  reports,
  resetPassword,
  saleDetail,
  saleNew,
];

export const toursById = new Map(TOURS.map((t) => [t.id, t]));

export function getTour(id: string): Tour | undefined {
  return toursById.get(id);
}

export function listTours(): Tour[] {
  return TOURS;
}

export function startTour(id: string, options: { force?: boolean } = {}): void {
  const tour = toursById.get(id);
  if (!tour) return;
  if (!options.force && hasCompleted(id)) return;

  destroyDriver();
  const drv = getDriver();

  // Wire onDestroyed to mark the tour as seen. Note: we deliberately do
  // NOT use onDestroyStarted — in driver.js 1.8 that hook is wired so
  // that setting it aborts destroy() entirely (the callback returns
  // before the cleanup runs), which leaves the popover stuck on screen
  // when the user clicks the close button or reaches the last step.
  // onDestroyed fires AFTER destroy completes, so it is the safe hook
  // for "remember the user saw this".
  drv.setConfig({
    ...drv.getConfig(),
    onDestroyed: () => {
      markCompleted(id);
    },
  });

  drv.setSteps(tour.steps);
  drv.drive();
}

// For testing/dev: clears localStorage and reloads.
export function resetAllTours(): void {
  // import the storage helper lazily to avoid an SSR cycle
  void import("./storage").then((m) => m.resetAllTours());
}